import {
  Environment,
  StandardRelayerApp,
  StandardRelayerContext,
} from "@wormhole-foundation/relayer-engine";
import { CHAIN_ID_SEPOLIA, CHAIN_ID_ETH } from "@certusone/wormhole-sdk";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import {Tendermint37Client, TendermintClient} from "@cosmjs/tendermint-rpc";
import { DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import { GasPrice} from "@cosmjs/stargate";
import { Secp256k1, keccak256 } from "@cosmjs/crypto";


const hrp = "neutrond"
const gasPrice = ".025ntrn"

function getChainId() {
    const chainName = process.env.EMITTER_CHAIN; 
    switch(chainName){
        case "sepolia":{
            return CHAIN_ID_SEPOLIA;
        }
        case "ethereum": {
            return CHAIN_ID_ETH;
        }
        default: {
            throw new Error("invalid chain name");
        }
    }
}

export type Client = {
    wasm: SigningCosmWasmClient;
    // stargate: SigningStargateClient;
    signer: string;
    signer_addr: string;
    signer_pubkey: string;
};

export async function getSigningClient(): Promise<Client> {
    const signer = process.env.SIGNER;
    const networkURL = process.env.NETOWRK_URL; 
    const wallet = await DirectSecp256k1Wallet.fromKey(
        Buffer.from(signer, "hex"), hrp);
    const [account] = await wallet.getAccounts();
    const clientBase: TendermintClient = await Tendermint37Client.connect(networkURL)

    const wasm = await SigningCosmWasmClient.createWithSigner(
    clientBase,
    wallet,
    {
      gasPrice: GasPrice.fromString(gasPrice),
    }
  );

  const pubkey = Secp256k1.uncompressPubkey(account.pubkey);
  const ethaddr = keccak256(pubkey.slice(1)).slice(-20);

  return {
    wasm,
    signer: account.address,
    signer_addr: Buffer.from(ethaddr).toString("hex"),
    signer_pubkey: Buffer.from(account.pubkey).toString("hex"),
  };
}


(async function main() {
    const emitter_address = process.env.EMITTER_ADDRESS;
    const environment = process.env.ENVIRONMENT;
    const ismAddr = process.env.ISM_ADDR;
    const chain_id  = getChainId();
    console.log("Starting relayer...\n " +
        `environment: ${environment}` +
        `chain_id: ${chain_id}` +
        `emitter_address: ${emitter_address}`);
  // initialize relayer engine app, pass relevant config options
  const app = new StandardRelayerApp<StandardRelayerContext>(
      environment == "mainnet" ? Environment.MAINNET:  Environment.TESTNET,
    // other app specific config options can be set here for things
    // like retries, logger, or redis connection settings.
    {
      name: `worm-neutron-relayer`,
    },
  );
    const client = await getSigningClient();



  // add a filter with a callback that will be
  // invoked on finding a VAA that matches the filter
  app.chain(chain_id).address(
    emitter_address, 
    // callback function to invoke on new message
    async (ctx, next) => {
      ctx.logger.info(
        `Got a VAA with sequence: ${ctx.vaa?.sequence} from with txhash: ${ctx.sourceTxHash}`,
      );

        const vaa = ctx.vaaBytes;
        const {payload} = ctx.tokenBridge;

        client.wasm.execute(client.signer,
                       ismAddr,
                       {SubmitMeta: {metadata: vaa,
                                     message: payload
                                    }
                       }, "auto"
                      )


      // invoke the next layer in the middleware pipeline
      next();
    },
  );

  // start app, blocks until unrecoverable error or process is stopped
  await app.listen();
})();
