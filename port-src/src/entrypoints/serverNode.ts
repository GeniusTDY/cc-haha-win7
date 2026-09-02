import { startServer } from "../server";

startServer().catch((error) => {
  console.error("[server] fatal startup error:", error);
  process.exit(1);
});
