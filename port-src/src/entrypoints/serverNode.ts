import { startServer } from "../server";

Promise.resolve()
  .then(() => startServer())
  .catch((error) => {
    console.error("[server] fatal startup error:", error);
    process.exit(1);
  });
