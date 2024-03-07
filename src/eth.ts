import {
  ContractAbi,
  Web3,
  Web3BaseWalletAccount,
  Web3EthInterface,
} from "web3";
import { Contract } from "web3-eth-contract";
import * as ABIs from "./abis.json";
import { Config } from "./config";

export class EthClient {
  web3: Web3;
  account: Web3BaseWalletAccount;
  contract: Contract<ContractAbi>;

  constructor(config: Config) {
    this.web3 = new Web3(config.ethNetworkUrl);
    this.account = this.web3.eth.accountProvider.privateKeyToAccount(
      process.env.ETH_SIGNER,
    );
    this.web3.eth.accounts.wallet.push(this.account);
    this.contract = new this.web3.eth.Contract(
      ABIs.wormholeISM,
      config.ethIsmAddress,
    );
  }

  public submitVAA(vaa: Uint8Array) {
    const vaaBz = Web3.utils.toHex(vaa);
    this.contract.methods
      .execute(vaaBz)
      .send({ from: this.account.address })
      .on("receipt", (resp) =>
        console.log(`Tx submitted with response ${resp}`),
      )
      .on("error", (err) => console.log(`Failed to submit tx: ${err}`));
  }
}

function base64ToHex(base64: string) {
  const buffer = Buffer.from(base64, "base64");
  return buffer.toString("hex");
}
