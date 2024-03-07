import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { Tendermint37Client, TendermintClient } from "@cosmjs/tendermint-rpc";
import { DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import { Config } from "./config";

export class CosmosClient {
  wasm: SigningCosmWasmClient;
  signer: string;
  address: string;
  ismAddress: string;

  constructor() {
    this.signer = process.env.COSMOS_SIGNER;
  }
  public async build(config: Config) {
    const wallet = await DirectSecp256k1Wallet.fromKey(
      Buffer.from(this.signer, "hex"),
      config.cosmosHRP,
    );
    const [account] = await wallet.getAccounts();
    const clientBase: TendermintClient = await Tendermint37Client.connect(
      config.cosmosNetworkUrl,
    );

    this.wasm = await SigningCosmWasmClient.createWithSigner(
      clientBase,
      wallet,
      {
        gasPrice: GasPrice.fromString(config.cosmosGasPrice),
      },
    );

    this.address = account.address;

    return this;
  }

  submitVAA(vaa: Uint8Array) {
    const base64VAA = uint8ArraytoBase64(vaa);
    this.wasm
      .execute(
        this.address,
        this.ismAddress,
        { submit_v_a_a: { vaa: base64VAA } },
        "auto",
      )
      .then((resp) => console.log(`submitted tx with resp: ${resp}`))
      .catch((err) => console.log(`error submitting VAA: ${err}`));
  }
}

function uint8ArraytoBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...new Uint8Array(arr)));
}
