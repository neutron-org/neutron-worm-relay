import {
  Environment,
  StandardRelayerApp,
  StandardRelayerContext,
  defaultLogger,
} from "@wormhole-foundation/relayer-engine";

import { loadConfig } from "./config";
import { CosmosClient } from "./cosmos";
import { EthClient } from "./eth";

(async function main() {
  const config = loadConfig();

  defaultLogger.info(
    "Starting relayer...\n " + `config: ${JSON.stringify(config)}`,
  );
  // initialize relayer engine app, pass relevant config options
  const cosmosClient = await new CosmosClient().build(config);
  const ethClient = new EthClient(config);
  const app = new StandardRelayerApp<StandardRelayerContext>(
    config.environment == "mainnet" ? Environment.MAINNET : Environment.TESTNET,

    // TODO: move these to config
    {
      name: `worm-neutron-relayer`,
      redis: {
        host: "172.17.0.1",
        port: 6379,
      },
      spyEndpoint: "172.17.0.1:7073",
    },
  );

  // ETH => COSMOS
  app.chain(config.ethChainID).address(
    config.ethEmitterAddress,
    // callback function to invoke on new message
    async (ctx, next) => {
      ctx.logger.info(
        `Got a VAA with sequence: ${ctx.vaa?.sequence} from with txhash: ${ctx.sourceTxHash}`,
      );
      cosmosClient.submitVAA(ctx.vaaBytes);

      // invoke the next layer in the middleware pipeline
      next();
    },
  );
  // COSMOS => ETH
  app.chain(config.cosmosChainID).address(
    config.cosmosEmitterAddress,
    // callback function to invoke on new message
    async (ctx, next) => {
      ctx.logger.info(
        `Got a VAA with sequence: ${ctx.vaa?.sequence} from with txhash: ${ctx.sourceTxHash}`,
      );
      ethClient.submitVAA(ctx.vaaBytes);

      // invoke the next layer in the middleware pipeline
      next();
    },
  );

  // start app, blocks until unrecoverable error or process is stopped
  await app.listen();
})();
