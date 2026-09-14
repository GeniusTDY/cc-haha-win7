import { createRequire as __nodePortCreateRequire } from 'node:module';
import { fileURLToPath as __nodePortF2P } from 'node:url';
import { dirname as __nodePortDirname } from 'node:path';
var require = __nodePortCreateRequire(import.meta.url);
var __filename = __nodePortF2P(import.meta.url);
var __dirname = __nodePortDirname(__filename);
process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";
import {
  init_define_MACRO
} from "./chunk-57T55QIK.mjs";

// adapters/common/project-selection-router.ts
init_define_MACRO();
var NON_PROJECT_COMMANDS = /* @__PURE__ */ new Set([
  "/help",
  "\u5E2E\u52A9",
  "/status",
  "\u72B6\u6001",
  "/clear",
  "\u6E05\u7A7A",
  "/stop",
  "\u505C\u6B62",
  "/projects",
  "\u9879\u76EE\u5217\u8868"
]);
var ProjectSelectionRouter = class {
  pendingChats = /* @__PURE__ */ new Set();
  markPickerShown(chatId) {
    this.pendingChats.add(chatId);
  }
  clear(chatId) {
    this.pendingChats.delete(chatId);
  }
  route(chatId, text) {
    const trimmed = text.trim();
    if (trimmed === "/new" || trimmed === "\u65B0\u4F1A\u8BDD" || trimmed.startsWith("/new ")) {
      const query = trimmed.startsWith("/new ") ? trimmed.slice(5).trim() : "";
      return { kind: "new", query: query || void 0 };
    }
    if (this.pendingChats.has(chatId) && trimmed && !NON_PROJECT_COMMANDS.has(trimmed)) {
      return { kind: "picker_reply", query: trimmed };
    }
    return null;
  }
};
var ProjectSelectionController = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  router = new ProjectSelectionRouter();
  async listProjects(chatId) {
    const projects = await this.deps.httpClient.listRecentProjects();
    if (projects.length > 0) this.router.markPickerShown(chatId);
    return projects;
  }
  clear(chatId) {
    this.router.clear(chatId);
  }
  async handleInput(chatId, text) {
    const route = this.router.route(chatId, text);
    if (!route) return null;
    await this.deps.prepareNewSession(chatId);
    this.router.clear(chatId);
    if (!route.query) {
      const created = await this.deps.createSession(chatId, this.deps.defaultWorkDir);
      return created ? { kind: "created" } : { kind: "creation_failed" };
    }
    try {
      const { project, ambiguous } = await this.deps.httpClient.matchProject(route.query);
      if (project) {
        const created = await this.deps.createSession(chatId, project.realPath);
        return created ? { kind: "created", project } : { kind: "creation_failed" };
      }
      if (ambiguous) return { kind: "ambiguous", projects: ambiguous };
      return { kind: "not_found", query: route.query };
    } catch (err) {
      return { kind: "error", message: err instanceof Error ? err.message : String(err) };
    }
  }
};
function formatAmbiguousProjectSelection(projects) {
  const choices = projects.map((project, index) => `${index + 1}. **${project.projectName}** \u2014 ${project.realPath}`).join("\n");
  return `\u5339\u914D\u5230\u591A\u4E2A\u9879\u76EE\uFF0C\u8BF7\u53D1\u9001 /new <\u66F4\u5B8C\u6574\u540D\u79F0\u6216\u8DEF\u5F84> \u9009\u62E9\uFF1A

${choices}`;
}
function formatProjectSelectionOutcome(outcome) {
  switch (outcome.kind) {
    case "created":
      return outcome.project ? `\u2705 \u5DF2\u65B0\u5EFA\u4F1A\u8BDD\uFF1A**${outcome.project.projectName}**${outcome.project.branch ? ` (${outcome.project.branch})` : ""}` : "\u2705 \u5DF2\u65B0\u5EFA\u4F1A\u8BDD\uFF0C\u53EF\u4EE5\u5F00\u59CB\u5BF9\u8BDD\u4E86\u3002";
    case "creation_failed":
      return null;
    case "ambiguous":
      return formatAmbiguousProjectSelection(outcome.projects);
    case "not_found":
      return `\u672A\u627E\u5230\u5339\u914D "${outcome.query}" \u7684\u9879\u76EE\u3002\u53D1\u9001 /projects \u67E5\u770B\u5B8C\u6574\u5217\u8868\u3002`;
    case "error":
      return `\u274C ${outcome.message}`;
  }
}

export {
  ProjectSelectionController,
  formatProjectSelectionOutcome
};
//# sourceMappingURL=chunk-JLBOFLQJ.mjs.map
