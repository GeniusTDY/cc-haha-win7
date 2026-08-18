import { createRequire as __nodePortCreateRequire } from 'node:module';
import { fileURLToPath as __nodePortF2P } from 'node:url';
import { dirname as __nodePortDirname } from 'node:path';
var require = __nodePortCreateRequire(import.meta.url);
var __filename = __nodePortF2P(import.meta.url);
var __dirname = __nodePortDirname(__filename);
process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";
import {
  AbstractID3Parser
} from "./chunk-AVAAWTSW.mjs";
import {
  ID3v2Parser
} from "./chunk-PXIYW7Y3.mjs";
import "./chunk-3QXLAF6U.mjs";
import {
  FourCcToken
} from "./chunk-UHW2DQ6J.mjs";
import "./chunk-JA4MBNFT.mjs";
import "./chunk-LNPOIRAU.mjs";
import "./chunk-NKZVK74F.mjs";
import {
  INT32_LE,
  INT64_LE,
  UINT64_LE,
  makeUnexpectedFileContentError
} from "./chunk-V6SIGNHR.mjs";
import {
  require_src
} from "./chunk-D5QCWSN2.mjs";
import {
  __toESM,
  init_define_MACRO
} from "./chunk-YXQ2ETWJ.mjs";

// adapters/node_modules/music-metadata/lib/dsf/DsfParser.js
init_define_MACRO();
var import_debug = __toESM(require_src(), 1);

// adapters/node_modules/music-metadata/lib/dsf/DsfChunk.js
init_define_MACRO();
var ChunkHeader = {
  len: 12,
  get: (buf, off) => {
    return { id: FourCcToken.get(buf, off), size: UINT64_LE.get(buf, off + 4) };
  }
};
var DsdChunk = {
  len: 16,
  get: (buf, off) => {
    return {
      fileSize: INT64_LE.get(buf, off),
      metadataPointer: INT64_LE.get(buf, off + 8)
    };
  }
};
var FormatChunk = {
  len: 40,
  get: (buf, off) => {
    return {
      formatVersion: INT32_LE.get(buf, off),
      formatID: INT32_LE.get(buf, off + 4),
      channelType: INT32_LE.get(buf, off + 8),
      channelNum: INT32_LE.get(buf, off + 12),
      samplingFrequency: INT32_LE.get(buf, off + 16),
      bitsPerSample: INT32_LE.get(buf, off + 20),
      sampleCount: INT64_LE.get(buf, off + 24),
      blockSizePerChannel: INT32_LE.get(buf, off + 32)
    };
  }
};

// adapters/node_modules/music-metadata/lib/dsf/DsfParser.js
var debug = (0, import_debug.default)("music-metadata:parser:DSF");
var DsdContentParseError = class extends makeUnexpectedFileContentError("DSD") {
};
var DsfParser = class extends AbstractID3Parser {
  async postId3v2Parse() {
    const p0 = this.tokenizer.position;
    const chunkHeader = await this.tokenizer.readToken(ChunkHeader);
    if (chunkHeader.id !== "DSD ")
      throw new DsdContentParseError("Invalid chunk signature");
    this.metadata.setFormat("container", "DSF");
    this.metadata.setFormat("lossless", true);
    this.metadata.setAudioOnly();
    const dsdChunk = await this.tokenizer.readToken(DsdChunk);
    if (dsdChunk.metadataPointer === BigInt(0)) {
      debug("No ID3v2 tag present");
    } else {
      debug(`expect ID3v2 at offset=${dsdChunk.metadataPointer}`);
      await this.parseChunks(dsdChunk.fileSize - chunkHeader.size);
      await this.tokenizer.ignore(Number(dsdChunk.metadataPointer) - this.tokenizer.position - p0);
      return new ID3v2Parser().parse(this.metadata, this.tokenizer, this.options);
    }
  }
  async parseChunks(bytesRemaining) {
    while (bytesRemaining >= ChunkHeader.len) {
      const chunkHeader = await this.tokenizer.readToken(ChunkHeader);
      debug(`Parsing chunk name=${chunkHeader.id} size=${chunkHeader.size}`);
      switch (chunkHeader.id) {
        case "fmt ": {
          const formatChunk = await this.tokenizer.readToken(FormatChunk);
          this.metadata.setFormat("numberOfChannels", formatChunk.channelNum);
          this.metadata.setFormat("sampleRate", formatChunk.samplingFrequency);
          this.metadata.setFormat("bitsPerSample", formatChunk.bitsPerSample);
          this.metadata.setFormat("numberOfSamples", formatChunk.sampleCount);
          this.metadata.setFormat("duration", Number(formatChunk.sampleCount) / formatChunk.samplingFrequency);
          const bitrate = formatChunk.bitsPerSample * formatChunk.samplingFrequency * formatChunk.channelNum;
          this.metadata.setFormat("bitrate", bitrate);
          return;
        }
        default:
          this.tokenizer.ignore(Number(chunkHeader.size) - ChunkHeader.len);
          break;
      }
      bytesRemaining -= chunkHeader.size;
    }
  }
};
export {
  DsdContentParseError,
  DsfParser
};
//# sourceMappingURL=DsfParser-CNEJ5HXU.mjs.map
