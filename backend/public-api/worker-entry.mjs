import { Client } from "pg";
import { createStagingWorker } from "./staging-worker.mjs";
export default createStagingWorker({createDbClient:config=>new Client(config)});
