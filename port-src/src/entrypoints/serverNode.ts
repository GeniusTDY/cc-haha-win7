// serverNode.ts — Node entrypoint for the server bundle (Win7 port).
//
// Under Bun, `src/server/index.ts` self-starts via `if (import.meta.main)`.
// That property is `undefined` under Node, so a plain Node run of the
// server module would import everything but never listen. This wrapper is
// the explicit entry the esbuild pipeline (port-src/scripts/node-port/
// build.mjs) bundles into dist/server.mjs: it imports the server and
// unconditionally calls startServer(), keeping the in-module
// `import.meta.main` branch inert (false under Node).
//
// Shipped artifact reference: runtime/node-fallback/server.mjs ends with
// exactly this call:
//   startServer().catch((error) => {
//     console.error("[server] fatal startup error:", error);
//     process.exit(1);
//   });
import { startServer } from "../server";

startServer().catch((error) => {
  console.error("[server] fatal startup error:", error);
  process.exit(1);
});
