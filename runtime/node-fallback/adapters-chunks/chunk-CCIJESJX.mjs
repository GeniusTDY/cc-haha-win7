import { createRequire as __nodePortCreateRequire } from 'node:module';
import { fileURLToPath as __nodePortF2P } from 'node:url';
import { dirname as __nodePortDirname } from 'node:path';
var require = __nodePortCreateRequire(import.meta.url);
var __filename = __nodePortF2P(import.meta.url);
var __dirname = __nodePortDirname(__filename);
process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";
import {
  ID3v2Parser
} from "./chunk-RWXWSBCV.mjs";
import {
  ID3v1Parser
} from "./chunk-JISFYO2B.mjs";
import {
  EndOfStreamError
} from "./chunk-GVXX2XIN.mjs";
import {
  ID3v2Header
} from "./chunk-5GBN3SJ2.mjs";
import {
  BasicParser
} from "./chunk-WJ3RKVZ2.mjs";
import {
  require_src
} from "./chunk-EGNMGFGK.mjs";
import {
  __toESM,
  init_define_MACRO
} from "./chunk-W6QE2DL3.mjs";

// adapters/node_modules/music-metadata/lib/id3v2/AbstractID3Parser.js
init_define_MACRO();
var import_debug = __toESM(require_src(), 1);
var debug = (0, import_debug.default)("music-metadata:parser:ID3");
var AbstractID3Parser = class extends BasicParser {
  constructor() {
    super(...arguments);
    this.id3parser = new ID3v2Parser();
  }
  static async startsWithID3v2Header(tokenizer) {
    return (await tokenizer.peekToken(ID3v2Header)).fileIdentifier === "ID3";
  }
  async parse() {
    try {
      await this.parseID3v2();
    } catch (err) {
      if (err instanceof EndOfStreamError) {
        debug("End-of-stream");
      } else {
        throw err;
      }
    }
  }
  finalize() {
    return;
  }
  async parseID3v2() {
    await this.tryReadId3v2Headers();
    debug("End of ID3v2 header, go to MPEG-parser: pos=%s", this.tokenizer.position);
    await this.postId3v2Parse();
    if (this.options.skipPostHeaders && this.metadata.hasAny()) {
      this.finalize();
    } else {
      const id3v1parser = new ID3v1Parser(this.metadata, this.tokenizer, this.options);
      await id3v1parser.parse();
      this.finalize();
    }
  }
  async tryReadId3v2Headers() {
    const id3Header = await this.tokenizer.peekToken(ID3v2Header);
    if (id3Header.fileIdentifier === "ID3") {
      debug("Found ID3v2 header, pos=%s", this.tokenizer.position);
      await this.id3parser.parse(this.metadata, this.tokenizer, this.options);
      return this.tryReadId3v2Headers();
    }
  }
};

export {
  AbstractID3Parser
};
//# sourceMappingURL=chunk-CCIJESJX.mjs.map
