import { createRequire as __nodePortCreateRequire } from 'node:module';
import { fileURLToPath as __nodePortF2P } from 'node:url';
import { dirname as __nodePortDirname } from 'node:path';
var require = __nodePortCreateRequire(import.meta.url);
var __filename = __nodePortF2P(import.meta.url);
var __dirname = __nodePortDirname(__filename);
process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";
import {
  AbstractID3Parser
} from "./chunk-ATM2K7ER.mjs";
import {
  ID3v2Parser
} from "./chunk-LIV5OP43.mjs";
import "./chunk-WI2EVJBY.mjs";
import {
  FourCcToken
} from "./chunk-B4XAMUJS.mjs";
import {
  ID3v2Header
} from "./chunk-SC7EGE24.mjs";
import "./chunk-DH234AGF.mjs";
import {
  INT32_LE,
  INT64_LE,
  UINT64_LE,
  makeUnexpectedFileContentError
} from "./chunk-73K2K442.mjs";
import {
  require_src
} from "./chunk-HEGWJCBF.mjs";
import {
  __toESM,
  init_define_MACRO
} from "./chunk-57T55QIK.mjs";

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
      fileSize: UINT64_LE.get(buf, off),
      metadataPointer: UINT64_LE.get(buf, off + 8)
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
    if (chunkHeader.id !== "DSD ") {
      throw new DsdContentParseError("Invalid chunk signature");
    }
    if (chunkHeader.size !== BigInt(ChunkHeader.len + DsdChunk.len)) {
      throw new DsdContentParseError(`Invalid DSD chunk size: ${chunkHeader.size}`);
    }
    this.metadata.setFormat("container", "DSF");
    this.metadata.setFormat("lossless", true);
    this.metadata.setAudioOnly();
    const dsdChunk = await this.tokenizer.readToken(DsdChunk);
    if (dsdChunk.fileSize < chunkHeader.size) {
      throw new DsdContentParseError(`Invalid DSF file size: ${dsdChunk.fileSize}`);
    }
    await this.parseChunks(dsdChunk.fileSize - chunkHeader.size);
    if (dsdChunk.metadataPointer === 0n) {
      debug("No ID3v2 tag present");
      return;
    }
    debug(`expect ID3v2 at offset=${dsdChunk.metadataPointer}`);
    const metadataOffset = dsdChunk.metadataPointer - BigInt(this.tokenizer.position - p0);
    if (metadataOffset < 0n || metadataOffset > BigInt(Number.MAX_SAFE_INTEGER) || dsdChunk.metadataPointer + BigInt(ID3v2Header.len) > dsdChunk.fileSize) {
      throw new DsdContentParseError(`Invalid metadata pointer: ${dsdChunk.metadataPointer}`);
    }
    await this.tokenizer.ignore(Number(metadataOffset));
    return new ID3v2Parser().parse(this.metadata, this.tokenizer, this.options);
  }
  async parseChunks(bytesRemaining) {
    const chunkHeaderSize = BigInt(ChunkHeader.len);
    while (bytesRemaining >= chunkHeaderSize) {
      const chunkHeader = await this.tokenizer.readToken(ChunkHeader);
      debug(`Parsing chunk name=${chunkHeader.id} size=${chunkHeader.size}`);
      if (chunkHeader.size < chunkHeaderSize) {
        throw new DsdContentParseError(`Invalid ${chunkHeader.id} chunk size: ${chunkHeader.size}`);
      }
      if (chunkHeader.size > bytesRemaining) {
        throw new DsdContentParseError(`${chunkHeader.id} chunk exceeds remaining file size`);
      }
      const payloadSize = chunkHeader.size - chunkHeaderSize;
      switch (chunkHeader.id) {
        case "fmt ": {
          if (payloadSize < BigInt(FormatChunk.len)) {
            throw new DsdContentParseError(`Invalid fmt chunk size: ${chunkHeader.size}`);
          }
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
          await this.tokenizer.ignore(Number(payloadSize));
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
//# sourceMappingURL=DsfParser-OYMWNECD.mjs.map
