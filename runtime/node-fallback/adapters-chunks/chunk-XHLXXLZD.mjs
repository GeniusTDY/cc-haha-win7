import { createRequire as __nodePortCreateRequire } from 'node:module';
import { fileURLToPath as __nodePortF2P } from 'node:url';
import { dirname as __nodePortDirname } from 'node:path';
var require = __nodePortCreateRequire(import.meta.url);
var __filename = __nodePortF2P(import.meta.url);
var __dirname = __nodePortDirname(__filename);
process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";
import {
  __commonJS,
  __require,
  __toESM,
  init_define_MACRO
} from "./chunk-YXQ2ETWJ.mjs";

// adapters/node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "adapters/node_modules/ws/lib/constants.js"(exports, module) {
    "use strict";
    init_define_MACRO();
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: /* @__PURE__ */ Symbol("kIsForOnEventAttribute"),
      kListener: /* @__PURE__ */ Symbol("kListener"),
      kStatusCode: /* @__PURE__ */ Symbol("status-code"),
      kWebSocket: /* @__PURE__ */ Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// adapters/node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "adapters/node_modules/ws/lib/buffer-util.js"(exports, module) {
    "use strict";
    init_define_MACRO();
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = __require("bufferutil");
        module.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// adapters/node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "adapters/node_modules/ws/lib/limiter.js"(exports, module) {
    "use strict";
    init_define_MACRO();
    var kDone = /* @__PURE__ */ Symbol("kDone");
    var kRun = /* @__PURE__ */ Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module.exports = Limiter;
  }
});

// adapters/node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "adapters/node_modules/ws/lib/permessage-deflate.js"(exports, module) {
    "use strict";
    init_define_MACRO();
    var zlib = __require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = /* @__PURE__ */ Symbol("permessage-deflate");
    var kTotalLength = /* @__PURE__ */ Symbol("total-length");
    var kCallback = /* @__PURE__ */ Symbol("callback");
    var kBuffers = /* @__PURE__ */ Symbol("buffers");
    var kError = /* @__PURE__ */ Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate2 = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [options.isServer=false] Create the instance in either
       *     server or client mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       */
      constructor(options) {
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._maxPayload = this._options.maxPayload | 0;
        this._isServer = !!this._options.isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && (typeof params.client_max_window_bits === "number" ? opts.clientMaxWindowBits > params.client_max_window_bits : !params.client_max_window_bits)) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module.exports = PerMessageDeflate2;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// adapters/node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "adapters/node_modules/ws/lib/validation.js"(exports, module) {
    "use strict";
    init_define_MACRO();
    var { isUtf8 } = __require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = __require("utf-8-validate");
        module.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// adapters/node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "adapters/node_modules/ws/lib/receiver.js"(exports, module) {
    "use strict";
    init_define_MACRO();
    var { Writable } = __require("stream");
    var PerMessageDeflate2 = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxBufferedChunks = options.maxBufferedChunks | 0;
        this._maxFragments = options.maxFragments | 0;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._numFragments = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
          cb(
            this.createError(
              RangeError,
              "Too many buffered chunks",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            )
          );
          return;
        }
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate2.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
          const error = this.createError(
            RangeError,
            "Too many message fragments",
            false,
            1008,
            "WS_ERR_TOO_MANY_BUFFERED_PARTS"
          );
          cb(error);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._numFragments = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module.exports = Receiver2;
  }
});

// adapters/node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "adapters/node_modules/ws/lib/sender.js"(exports, module) {
    "use strict";
    init_define_MACRO();
    var { Duplex } = __require("stream");
    var { randomFillSync } = __require("crypto");
    var {
      types: { isUint8Array }
    } = __require("util");
    var PerMessageDeflate2 = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = /* @__PURE__ */ Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else if (isUint8Array(data)) {
            buf.set(data, 2);
          } else {
            throw new TypeError("Second argument must be a string or a Uint8Array");
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// adapters/node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "adapters/node_modules/ws/lib/event-target.js"(exports, module) {
    "use strict";
    init_define_MACRO();
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = /* @__PURE__ */ Symbol("kCode");
    var kData = /* @__PURE__ */ Symbol("kData");
    var kError = /* @__PURE__ */ Symbol("kError");
    var kMessage = /* @__PURE__ */ Symbol("kMessage");
    var kReason = /* @__PURE__ */ Symbol("kReason");
    var kTarget = /* @__PURE__ */ Symbol("kTarget");
    var kType = /* @__PURE__ */ Symbol("kType");
    var kWasClean = /* @__PURE__ */ Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// adapters/node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "adapters/node_modules/ws/lib/extension.js"(exports, module) {
    "use strict";
    init_define_MACRO();
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse3(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension2) => {
        let configurations = extensions[extension2];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension2].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module.exports = { format, parse: parse3 };
  }
});

// adapters/node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "adapters/node_modules/ws/lib/websocket.js"(exports, module) {
    "use strict";
    init_define_MACRO();
    var EventEmitter = __require("events");
    var https = __require("https");
    var http = __require("http");
    var net = __require("net");
    var tls = __require("tls");
    var { randomBytes: randomBytes2, createHash } = __require("crypto");
    var { Duplex, Readable } = __require("stream");
    var { URL: URL2 } = __require("url");
    var PerMessageDeflate2 = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse: parse3 } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = /* @__PURE__ */ Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxBufferedChunks: options.maxBufferedChunks,
          maxFragments: options.maxFragments,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate2.extensionName]) {
          this._extensions[PerMessageDeflate2.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate2.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxBufferedChunks: 256 * 1024,
        maxFragments: 16 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL2) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL2(address);
        } catch {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes2(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate2({
          ...opts.perMessageDeflate,
          isServer: false,
          maxPayload: opts.maxPayload
        });
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate2.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL2(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse3(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate2.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate2.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxBufferedChunks: opts.maxBufferedChunks,
          maxFragments: opts.maxFragments,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// adapters/node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "adapters/node_modules/ws/lib/stream.js"(exports, module) {
    "use strict";
    init_define_MACRO();
    var WebSocket2 = require_websocket();
    var { Duplex } = __require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module.exports = createWebSocketStream2;
  }
});

// adapters/node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "adapters/node_modules/ws/lib/subprotocol.js"(exports, module) {
    "use strict";
    init_define_MACRO();
    var { tokenChars } = require_validation();
    function parse3(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module.exports = { parse: parse3 };
  }
});

// adapters/node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "adapters/node_modules/ws/lib/websocket-server.js"(exports, module) {
    "use strict";
    init_define_MACRO();
    var EventEmitter = __require("events");
    var http = __require("http");
    var { Duplex } = __require("stream");
    var { createHash } = __require("crypto");
    var extension2 = require_extension();
    var PerMessageDeflate2 = require_permessage_deflate();
    var subprotocol2 = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=16384] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxBufferedChunks: 256 * 1024,
          maxFragments: 16 * 1024,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol2.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate2({
            ...this.options.perMessageDeflate,
            isServer: true,
            maxPayload: this.options.maxPayload
          });
          try {
            const offers = extension2.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate2.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate2.extensionName]);
              extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate2.extensionName]) {
          const params = extensions[PerMessageDeflate2.extensionName].params;
          const value = extension2.format({
            [PerMessageDeflate2.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxBufferedChunks: this.options.maxBufferedChunks,
          maxFragments: this.options.maxFragments,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module.exports = WebSocketServer2;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// adapters/common/ws-bridge.ts
init_define_MACRO();

// adapters/node_modules/ws/wrapper.mjs
init_define_MACRO();
var import_stream = __toESM(require_stream(), 1);
var import_extension = __toESM(require_extension(), 1);
var import_permessage_deflate = __toESM(require_permessage_deflate(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_subprotocol = __toESM(require_subprotocol(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);
var wrapper_default = import_websocket.default;

// adapters/common/ws-bridge.ts
var HEARTBEAT_INTERVAL_MS = 3e4;
var RECONNECT_BASE_MS = 1e3;
var RECONNECT_MAX_MS = 3e4;
var MAX_RECONNECT_ATTEMPTS = 10;
var WsBridge = class {
  sessions = /* @__PURE__ */ new Map();
  /** Single handler per chatId — separate from sessions so reconnect doesn't duplicate */
  handlers = /* @__PURE__ */ new Map();
  /** Per-chat FIFO queue of in-flight handler promises.
   *  Ensures an async handler for message N completes before handler for N+1
   *  starts, preventing state races at `await` points. */
  handlerChains = /* @__PURE__ */ new Map();
  serverUrl;
  platform;
  localAccessToken;
  heartbeatTimer = null;
  destroyed = false;
  constructor(serverUrl, platform, localAccessToken = process.env.CC_HAHA_LOCAL_ACCESS_TOKEN) {
    this.serverUrl = serverUrl.replace(/\/$/, "");
    this.platform = platform;
    this.localAccessToken = localAccessToken?.trim() || null;
    this.startHeartbeat();
  }
  /** Connect to a session with a known sessionId. Returns false if already connected. */
  connectSession(chatId, sessionId) {
    const existing = this.sessions.get(chatId);
    if (existing && existing.ws.readyState === wrapper_default.OPEN) {
      return false;
    }
    this.connect(chatId, sessionId);
    return true;
  }
  /** Send a user message to the session bound to chatId. */
  sendUserMessage(chatId, content, attachments) {
    const payload = { type: "user_message", content };
    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }
    return this.send(chatId, payload);
  }
  /** Respond to a permission request.
   *
   * @param rule - optional rule name to make the permission persistent.
   *   Currently the server supports `'always'`, which uses the CLI's
   *   permission_suggestions to produce updatedPermissions so the same
   *   tool call won't prompt again in this session. Omit for one-shot allow. */
  sendPermissionResponse(chatId, requestId, allowed, rule) {
    const message = {
      type: "permission_response",
      requestId,
      allowed
    };
    if (rule) message.rule = rule;
    return this.send(chatId, message);
  }
  /** Stop the current generation. */
  sendStopGeneration(chatId) {
    return this.send(chatId, { type: "stop_generation" });
  }
  /** Register (or replace) the handler for server messages on a specific chatId. */
  onServerMessage(chatId, handler) {
    this.handlers.set(chatId, handler);
  }
  getSessionId(chatId) {
    return this.sessions.get(chatId)?.sessionId ?? null;
  }
  isSessionOpen(chatId, sessionId) {
    const session = this.sessions.get(chatId);
    if (!session) return false;
    if (sessionId && session.sessionId !== sessionId) return false;
    return session.ws.readyState === wrapper_default.OPEN;
  }
  /** Reset session for a chatId (e.g. /new command). */
  resetSession(chatId) {
    const session = this.sessions.get(chatId);
    if (session) {
      if (session.reconnectTimer) clearTimeout(session.reconnectTimer);
      this.closeSocket(session.ws, 1e3, "session reset");
      this.sessions.delete(chatId);
    }
    this.handlers.delete(chatId);
    this.handlerChains.delete(chatId);
  }
  /** Has a session (connected or handler registered) for chatId. */
  hasSession(chatId) {
    return this.sessions.has(chatId) || this.handlers.has(chatId);
  }
  /** Destroy all sessions. */
  destroy() {
    this.destroyed = true;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    for (const [, session] of this.sessions) {
      if (session.reconnectTimer) clearTimeout(session.reconnectTimer);
      this.closeSocket(session.ws, 1e3, "bridge destroyed");
    }
    this.sessions.clear();
    this.handlers.clear();
    this.handlerChains.clear();
  }
  // ------- internal -------
  connect(chatId, sessionId) {
    const url = new URL(`${this.serverUrl}/ws/${sessionId}`);
    if (this.localAccessToken) {
      url.searchParams.set("token", this.localAccessToken);
    }
    const ws = new wrapper_default(url);
    const prev = this.sessions.get(chatId);
    if (prev) {
      if (prev.reconnectTimer) clearTimeout(prev.reconnectTimer);
      this.closeSocket(prev.ws, 1e3, "session replaced");
    }
    const session = {
      sessionId,
      ws,
      reconnectAttempts: prev?.reconnectAttempts ?? 0,
      reconnectTimer: null
    };
    this.sessions.set(chatId, session);
    ws.on("open", () => {
      console.log(`[WsBridge] Connected: ${sessionId}`);
      session.reconnectAttempts = 0;
    });
    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch (err) {
        console.error("[WsBridge] Parse error:", err);
        return;
      }
      if (msg.type === "pong") return;
      if (this.sessions.get(chatId) !== session) return;
      const handler = this.handlers.get(chatId);
      if (!handler) return;
      const prev2 = this.handlerChains.get(chatId) ?? Promise.resolve();
      const next = prev2.catch(() => {
      }).then(() => Promise.resolve().then(() => handler(msg))).catch((err) => {
        console.error(`[WsBridge] Handler error on ${chatId}:`, err);
      });
      this.handlerChains.set(chatId, next);
    });
    ws.on("close", (code, reason) => {
      console.log(`[WsBridge] Disconnected: ${sessionId} (${code}: ${reason})`);
      if (this.sessions.get(chatId) !== session) return;
      if (code === 1e3) {
        if (session.reconnectTimer) clearTimeout(session.reconnectTimer);
        this.sessions.delete(chatId);
        this.handlers.delete(chatId);
        this.handlerChains.delete(chatId);
        return;
      }
      this.scheduleReconnect(chatId, sessionId);
    });
    ws.on("error", (err) => {
      console.error(`[WsBridge] Error on ${sessionId}:`, err.message);
    });
  }
  closeSocket(ws, code, reason) {
    ws.removeAllListeners();
    if (ws.readyState === wrapper_default.CLOSED) return;
    if (ws.readyState === wrapper_default.CONNECTING) {
      const cleanup = () => {
        ws.removeListener("open", onOpen);
        ws.removeListener("error", onError);
        ws.removeListener("close", onClose);
      };
      const onOpen = () => {
        ws.removeListener("open", onOpen);
        ws.close(code, reason);
      };
      const onError = () => cleanup();
      const onClose = () => cleanup();
      ws.once("open", onOpen);
      ws.once("error", onError);
      ws.once("close", onClose);
      return;
    }
    const swallowTeardownError = () => {
    };
    ws.on("error", swallowTeardownError);
    ws.once("close", () => {
      ws.removeListener("error", swallowTeardownError);
    });
    ws.close(code, reason);
  }
  /** Wait until the WebSocket for chatId is open. Resolves false on timeout or error. */
  waitForOpen(chatId, timeoutMs = 1e4) {
    const session = this.sessions.get(chatId);
    if (!session) return Promise.resolve(false);
    if (session.ws.readyState === wrapper_default.OPEN) return Promise.resolve(true);
    return new Promise((resolve2) => {
      const timer = setTimeout(() => {
        cleanup();
        resolve2(false);
      }, timeoutMs);
      const onOpen = () => {
        cleanup();
        resolve2(true);
      };
      const onError = () => {
        cleanup();
        resolve2(false);
      };
      const onClose = () => {
        cleanup();
        resolve2(false);
      };
      const cleanup = () => {
        clearTimeout(timer);
        session.ws.removeListener("open", onOpen);
        session.ws.removeListener("error", onError);
        session.ws.removeListener("close", onClose);
      };
      session.ws.once("open", onOpen);
      session.ws.once("error", onError);
      session.ws.once("close", onClose);
    });
  }
  send(chatId, message) {
    const session = this.sessions.get(chatId);
    if (!session || session.ws.readyState !== wrapper_default.OPEN) {
      console.warn(`[WsBridge] Cannot send to ${chatId}: session not ready`);
      return false;
    }
    session.ws.send(JSON.stringify(message));
    return true;
  }
  scheduleReconnect(chatId, sessionId) {
    if (this.destroyed) return;
    const session = this.sessions.get(chatId);
    if (!session) return;
    if (session.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error(`[WsBridge] Max reconnect attempts reached for ${sessionId}, giving up`);
      this.sessions.delete(chatId);
      this.handlers.delete(chatId);
      return;
    }
    session.reconnectAttempts++;
    const delay = Math.min(
      RECONNECT_BASE_MS * Math.pow(2, session.reconnectAttempts - 1),
      RECONNECT_MAX_MS
    );
    console.log(`[WsBridge] Reconnecting ${sessionId} in ${delay}ms (attempt ${session.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    session.reconnectTimer = setTimeout(() => {
      if (this.destroyed) return;
      if (this.sessions.get(chatId)?.sessionId === sessionId) {
        this.connect(chatId, sessionId);
      }
    }, delay);
  }
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      for (const [, session] of this.sessions) {
        if (session.ws.readyState === wrapper_default.OPEN) {
          session.ws.send(JSON.stringify({ type: "ping" }));
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
  }
};

// adapters/common/message-dedup.ts
init_define_MACRO();
var DEFAULT_TTL_MS = 10 * 6e4;
var DEFAULT_MAX_ENTRIES = 5e3;
var SWEEP_INTERVAL_MS = 6e4;
var MessageDedup = class {
  constructor(ttlMs = DEFAULT_TTL_MS, maxEntries = DEFAULT_MAX_ENTRIES) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.sweepTimer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
  }
  ttlMs;
  maxEntries;
  store = /* @__PURE__ */ new Map();
  sweepTimer;
  /** Returns true if this is a NEW message, false if duplicate. */
  tryRecord(id) {
    const now = Date.now();
    const existing = this.store.get(id);
    if (existing !== void 0 && now - existing < this.ttlMs) {
      return false;
    }
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== void 0) this.store.delete(oldest);
    }
    this.store.set(id, now);
    return true;
  }
  sweep() {
    const now = Date.now();
    for (const [key, ts] of this.store) {
      if (now - ts >= this.ttlMs) {
        this.store.delete(key);
      } else {
        break;
      }
    }
  }
  destroy() {
    clearInterval(this.sweepTimer);
    this.store.clear();
  }
};

// adapters/common/chat-queue.ts
init_define_MACRO();
var queues = /* @__PURE__ */ new Map();
async function enqueue(chatId, fn) {
  const prev = queues.get(chatId) ?? Promise.resolve();
  const next = prev.then(fn, () => fn()).catch((err) => {
    console.error(`[ChatQueue] Error in task for chat ${chatId}:`, err);
  });
  queues.set(chatId, next);
  next.finally(() => {
    if (queues.get(chatId) === next) {
      queues.delete(chatId);
    }
  });
  return next;
}

// adapters/common/config.ts
init_define_MACRO();
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
function getConfigPath() {
  const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
  return path.join(configDir, "adapters.json");
}
function loadFile() {
  try {
    return JSON.parse(fs.readFileSync(getConfigPath(), "utf-8"));
  } catch (err) {
    if (err?.code !== "ENOENT") {
      console.warn(`[Config] Failed to parse ${getConfigPath()}, using defaults`);
    }
    return {};
  }
}
function loadConfig() {
  const file = loadFile();
  const tg = file.telegram ?? {};
  const fs_ = file.feishu ?? {};
  const wc = file.wechat ?? {};
  const dt = file.dingtalk ?? {};
  const wa = file.whatsapp ?? {};
  const pairing = file.pairing ?? {};
  const fallbackWorkDir = resolveUserDefaultWorkDir();
  const whatsappAuthDir = resolveConfiguredPath(
    process.env.WHATSAPP_AUTH_DIR || wa.authDir || defaultWhatsAppAuthDir()
  );
  return {
    serverUrl: process.env.ADAPTER_SERVER_URL || file.serverUrl || "ws://127.0.0.1:3456",
    defaultProjectDir: file.defaultProjectDir || "",
    pairing: {
      code: pairing.code ?? null,
      expiresAt: pairing.expiresAt ?? null,
      createdAt: pairing.createdAt ?? null
    },
    // File scope only. ADAPTER_ALLOWED_PROJECT_ROOTS is applied by
    // resolveAllowedProjectRoots so this field keeps one meaning.
    allowedProjectRoots: readProjectRoots(file.allowedProjectRoots),
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || tg.botToken || "",
      allowedUsers: tg.allowedUsers ?? [],
      pairedUsers: tg.pairedUsers ?? [],
      defaultWorkDir: tg.defaultWorkDir || fallbackWorkDir,
      allowedProjectRoots: readProjectRoots(tg.allowedProjectRoots)
    },
    feishu: {
      appId: process.env.FEISHU_APP_ID || fs_.appId || "",
      appSecret: process.env.FEISHU_APP_SECRET || fs_.appSecret || "",
      encryptKey: process.env.FEISHU_ENCRYPT_KEY || fs_.encryptKey || "",
      verificationToken: process.env.FEISHU_VERIFICATION_TOKEN || fs_.verificationToken || "",
      allowedUsers: fs_.allowedUsers ?? [],
      pairedUsers: fs_.pairedUsers ?? [],
      defaultWorkDir: fs_.defaultWorkDir || fallbackWorkDir,
      streamingCard: fs_.streamingCard ?? false,
      allowedProjectRoots: readProjectRoots(fs_.allowedProjectRoots)
    },
    wechat: {
      accountId: process.env.WECHAT_ACCOUNT_ID || wc.accountId || "",
      botToken: process.env.WECHAT_BOT_TOKEN || wc.botToken || "",
      baseUrl: process.env.WECHAT_BASE_URL || wc.baseUrl || "https://ilinkai.weixin.qq.com",
      userId: process.env.WECHAT_USER_ID || wc.userId || "",
      allowedUsers: wc.allowedUsers ?? [],
      pairedUsers: wc.pairedUsers ?? [],
      defaultWorkDir: wc.defaultWorkDir || fallbackWorkDir,
      allowedProjectRoots: readProjectRoots(wc.allowedProjectRoots)
    },
    dingtalk: {
      clientId: process.env.DINGTALK_CLIENT_ID || dt.clientId || "",
      clientSecret: process.env.DINGTALK_CLIENT_SECRET || dt.clientSecret || "",
      allowedUsers: dt.allowedUsers ?? [],
      pairedUsers: dt.pairedUsers ?? [],
      defaultWorkDir: dt.defaultWorkDir || fallbackWorkDir,
      endpoint: process.env.DINGTALK_STREAM_ENDPOINT || dt.endpoint || "https://api.dingtalk.com",
      permissionCardTemplateId: process.env.DINGTALK_PERMISSION_CARD_TEMPLATE_ID || dt.permissionCardTemplateId || "",
      allowedProjectRoots: readProjectRoots(dt.allowedProjectRoots)
    },
    whatsapp: {
      accountJid: process.env.WHATSAPP_ACCOUNT_JID || wa.accountJid || "",
      authDir: whatsappAuthDir,
      allowedUsers: wa.allowedUsers ?? [],
      pairedUsers: wa.pairedUsers ?? [],
      defaultWorkDir: wa.defaultWorkDir || fallbackWorkDir,
      allowedProjectRoots: readProjectRoots(wa.allowedProjectRoots)
    }
  };
}
function getConfiguredWorkDir(config, platformConfig) {
  return config.defaultProjectDir || platformConfig.defaultWorkDir;
}
function resolveAllowedProjectRoots(config, platformConfig) {
  const configured = readEnvProjectRoots() ?? (platformConfig.allowedProjectRoots.length > 0 ? platformConfig.allowedProjectRoots : config.allowedProjectRoots);
  if (configured.length > 0) {
    const candidates = configured.map(resolveExistingDirectory);
    const missing = candidates.filter((value) => !value).length;
    const resolved = dedupePaths(candidates);
    if (resolved.length > 0) {
      if (missing > 0) {
        console.warn(
          missing === 1 ? "[Config] Ignoring 1 allowedProjectRoots entry that does not exist" : `[Config] Ignoring ${missing} allowedProjectRoots entries that do not exist`
        );
      }
      return resolved;
    }
    console.warn(
      "[Config] None of the configured allowedProjectRoots exist; falling back to the default roots (home directory + default project dir)"
    );
  }
  const home = resolveExistingDirectory(os.homedir());
  const defaults = dedupePaths([
    home,
    // Only inherit the default work dir as a boundary when it is a real project
    // directory. "/" and "/Users" reach every project on the machine, so taking
    // them from the PWD/cwd() fallback would make the boundary meaningless.
    usableAsBoundary(resolveExistingDirectory(getConfiguredWorkDir(config, platformConfig)))
  ]);
  if (defaults.length > 0) return defaults;
  return [os.homedir()];
}
function usableAsBoundary(dir) {
  if (!dir) return null;
  if (path.parse(dir).root === dir) return null;
  return isStrictAncestor(dir, os.homedir()) ? null : dir;
}
function isStrictAncestor(candidate, target) {
  const relative3 = path.relative(candidate, target);
  return relative3 !== "" && !relative3.startsWith("..") && !path.isAbsolute(relative3);
}
function resolveAdapterWorkspace(config, platformConfig) {
  const allowedProjectRoots = resolveAllowedProjectRoots(config, platformConfig);
  const configured = resolveExistingDirectory(getConfiguredWorkDir(config, platformConfig));
  if (configured && isPathWithinRoots(configured, allowedProjectRoots)) {
    return { defaultWorkDir: configured, allowedProjectRoots };
  }
  const fallback = allowedProjectRoots[0] ?? os.homedir();
  if (configured) {
    console.warn(
      `[Config] Default project ${configured} is outside the allowed project roots; new sessions will start in ${fallback}`
    );
  }
  return { defaultWorkDir: fallback, allowedProjectRoots };
}
function isPathWithinRoots(target, roots) {
  return roots.some((root) => {
    const relative3 = path.relative(root, target);
    return relative3 === "" || !relative3.startsWith("..") && !path.isAbsolute(relative3);
  });
}
function readProjectRoots(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}
function readEnvProjectRoots() {
  const raw = process.env.ADAPTER_ALLOWED_PROJECT_ROOTS?.trim();
  if (!raw) return null;
  const roots = readProjectRoots(raw.split(path.delimiter));
  return roots.length > 0 ? roots : null;
}
function dedupePaths(values) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}
function resolveUserDefaultWorkDir() {
  const candidates = [
    process.env.ADAPTER_DEFAULT_PROJECT_DIR,
    process.env.CLAUDE_ADAPTER_DEFAULT_WORK_DIR,
    process.env.PWD,
    process.cwd()
  ];
  for (const candidate of candidates) {
    const resolved = usableAsBoundary(resolveExistingDirectory(candidate));
    if (resolved) return resolved;
  }
  return resolveExistingDirectory(os.homedir()) ?? os.homedir();
}
function resolveExistingDirectory(value) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const expanded = trimmed === "~" ? os.homedir() : trimmed.startsWith("~/") ? path.join(os.homedir(), trimmed.slice(2)) : trimmed;
  if (!path.isAbsolute(expanded)) return null;
  try {
    const realPath = fs.realpathSync(expanded);
    return fs.statSync(realPath).isDirectory() ? realPath : null;
  } catch {
    return null;
  }
}
function defaultWhatsAppAuthDir() {
  const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
  return path.join(configDir, "whatsapp-auth", "default");
}
function resolveConfiguredPath(value) {
  const trimmed = value.trim();
  if (!trimmed) return defaultWhatsAppAuthDir();
  const expanded = trimmed === "~" ? os.homedir() : trimmed.startsWith("~/") ? path.join(os.homedir(), trimmed.slice(2)) : trimmed;
  return path.resolve(expanded);
}

// adapters/common/format.ts
init_define_MACRO();
var IM_HELP_LINES = [
  "/new [\u9879\u76EE] / \u65B0\u4F1A\u8BDD \u2014 \u65B0\u5EFA\u4F1A\u8BDD\u6216\u5207\u6362\u9879\u76EE",
  "/projects / \u9879\u76EE\u5217\u8868 \u2014 \u67E5\u770B\u6700\u8FD1\u9879\u76EE",
  "/status / \u72B6\u6001 \u2014 \u67E5\u770B\u5F53\u524D\u4F1A\u8BDD\u72B6\u6001",
  "/clear / \u6E05\u7A7A \u2014 \u6E05\u7A7A\u5F53\u524D\u4F1A\u8BDD\u4E0A\u4E0B\u6587",
  "/stop / \u505C\u6B62 \u2014 \u505C\u6B62\u5F53\u524D\u751F\u6210",
  "/help / \u5E2E\u52A9 \u2014 \u663E\u793A\u8FD9\u4EFD\u5E2E\u52A9",
  "\u6743\u9650\u5BA1\u6279\uFF1A/allow <id>\u3001/always <id>\u3001/deny <id>"
];
function splitMessage(text, limit) {
  if (text.length <= limit) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= limit) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf("\n\n", limit);
    if (splitAt <= 0) splitAt = remaining.lastIndexOf("\n", limit);
    if (splitAt <= 0) splitAt = remaining.lastIndexOf(". ", limit);
    if (splitAt <= 0) splitAt = remaining.lastIndexOf(" ", limit);
    if (splitAt <= 0) splitAt = limit;
    if (remaining[splitAt] === "\n" || remaining[splitAt] === ".") splitAt += 1;
    chunks.push(remaining.slice(0, splitAt).trimEnd());
    remaining = remaining.slice(splitAt).trimStart();
  }
  return chunks;
}
function splitMarkdownTableRow(line) {
  const trimmed = line.trim();
  const inner = trimmed.startsWith("|") ? trimmed.slice(1) : trimmed;
  const withoutTrailingPipe = inner.endsWith("|") ? inner.slice(0, -1) : inner;
  return withoutTrailingPipe.split("|").map((cell) => cell.trim());
}
function isMarkdownTableDivider(line) {
  const cells = splitMarkdownTableRow(line);
  if (cells.length < 2) return false;
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}
function isPotentialMarkdownTableRow(line) {
  const trimmed = line.trim();
  return trimmed.includes("|") && splitMarkdownTableRow(trimmed).length >= 2;
}
function isFenceMarker(line) {
  return /^\s*(```|~~~)/.test(line);
}
function formatMarkdownTableAsBullets(table) {
  const { headers, rows } = table;
  if (headers.length === 0 || rows.length === 0) return "";
  const output = [];
  for (const row of rows) {
    if (row.every((cell) => !cell)) continue;
    const label = row[0];
    if (label) output.push(label);
    for (let i = 1; i < Math.max(headers.length, row.length); i++) {
      const value = row[i];
      if (!value) continue;
      const header = headers[i];
      output.push(`\u2022 ${header ? `${header}: ` : `Column ${i}: `}${value}`);
    }
    if (output[output.length - 1] !== "") output.push("");
  }
  while (output[output.length - 1] === "") output.pop();
  return output.join("\n");
}
function convertMarkdownTablesToBullets(markdown) {
  const lines = markdown.split("\n");
  const output = [];
  let inFence = false;
  let i = 0;
  while (i < lines.length) {
    const headerLine = lines[i] ?? "";
    if (isFenceMarker(headerLine)) {
      inFence = !inFence;
      output.push(headerLine);
      i += 1;
      continue;
    }
    const dividerLine = lines[i + 1] ?? "";
    if (!inFence && isPotentialMarkdownTableRow(headerLine) && isMarkdownTableDivider(dividerLine)) {
      const headers = splitMarkdownTableRow(headerLine);
      const rows = [];
      i += 2;
      while (i < lines.length && isPotentialMarkdownTableRow(lines[i] ?? "")) {
        rows.push(splitMarkdownTableRow(lines[i] ?? ""));
        i += 1;
      }
      const rendered = formatMarkdownTableAsBullets({ headers, rows });
      if (rendered) output.push(rendered);
      continue;
    }
    output.push(headerLine);
    i += 1;
  }
  return output.join("\n");
}
function formatPermissionRequest(toolName, input, requestId) {
  const preview = truncateInput(input, 300);
  return `\u{1F510} \u9700\u8981\u6743\u9650\u786E\u8BA4 [${requestId}]
\u5DE5\u5177: ${toolName}
${preview}`;
}
function truncateInput(input, maxLen) {
  try {
    const s = typeof input === "string" ? input : JSON.stringify(input, null, 2);
    return s.length > maxLen ? s.slice(0, maxLen) + "\u2026" : s;
  } catch {
    return "(unserializable)";
  }
}
function formatImHelp() {
  return `\u53EF\u7528\u547D\u4EE4\uFF1A

${IM_HELP_LINES.join("\n")}`;
}
function formatImStatus(summary) {
  if (!summary?.sessionId) {
    return "\u5F53\u524D\u6CA1\u6709\u6D3B\u52A8\u4F1A\u8BDD\u3002\n\n\u53D1\u9001 /new \u65B0\u5EFA\u4F1A\u8BDD\uFF0C\u6216\u53D1\u9001 /projects \u9009\u62E9\u9879\u76EE\u3002";
  }
  const lines = ["\u5F53\u524D\u4F1A\u8BDD\u72B6\u6001\uFF1A"];
  if (summary.projectName) {
    lines.push(`\u9879\u76EE: ${summary.projectName}${summary.branch ? ` (${summary.branch})` : ""}`);
  } else if (summary.branch) {
    lines.push(`\u5206\u652F: ${summary.branch}`);
  }
  lines.push(`\u4F1A\u8BDD: ${shortSessionId(summary.sessionId)}`);
  if (summary.model) {
    lines.push(`\u6A21\u578B: ${summary.model}`);
  }
  lines.push(`\u72B6\u6001: ${formatAdapterChatState(summary.state, summary.verb)}`);
  const pendingPermissionCount = summary.pendingPermissionCount ?? 0;
  if (pendingPermissionCount > 0) {
    lines.push(`\u5BA1\u6279: ${pendingPermissionCount} \u4E2A\u5F85\u786E\u8BA4`);
  }
  const taskCounts = summary.taskCounts;
  if (taskCounts && taskCounts.total > 0) {
    const taskParts = [`\u603B\u8BA1 ${taskCounts.total}`];
    if (taskCounts.inProgress > 0) taskParts.push(`\u8FDB\u884C\u4E2D ${taskCounts.inProgress}`);
    if (taskCounts.pending > 0) taskParts.push(`\u5F85\u5904\u7406 ${taskCounts.pending}`);
    if (taskCounts.completed > 0) taskParts.push(`\u5DF2\u5B8C\u6210 ${taskCounts.completed}`);
    lines.push(`\u4EFB\u52A1: ${taskParts.join(" \xB7 ")}`);
  }
  return lines.join("\n");
}
function formatAdapterChatState(state, verb) {
  const label = (() => {
    switch (state) {
      case "thinking":
        return "\u601D\u8003\u4E2D";
      case "streaming":
        return "\u751F\u6210\u4E2D";
      case "tool_executing":
        return "\u6267\u884C\u5DE5\u5177\u4E2D";
      case "permission_pending":
        return "\u7B49\u5F85\u6743\u9650\u786E\u8BA4";
      case "idle":
      default:
        return "\u7A7A\u95F2";
    }
  })();
  if (!verb || verb === "Thinking") return label;
  return `${label} (${verb})`;
}
function shortSessionId(sessionId) {
  return sessionId.length > 12 ? `${sessionId.slice(0, 8)}\u2026` : sessionId;
}

// adapters/common/permission.ts
init_define_MACRO();
function getSinglePendingRequestId(requestIds) {
  if (!requestIds) return null;
  const ids = Array.from(requestIds);
  return ids.length === 1 ? ids[0] : null;
}
function parsePermissionCommand(text, pendingRequestIds) {
  const trimmed = text.trim();
  const match = text.trim().match(/^\/(allow|always|allow-always|deny)\s+(\S+)/i);
  if (match) {
    const action = match[1].toLowerCase();
    const requestId2 = match[2];
    if (action === "deny") return { requestId: requestId2, allowed: false };
    if (action === "always" || action === "allow-always") return { requestId: requestId2, allowed: true, rule: "always" };
    return { requestId: requestId2, allowed: true };
  }
  const requestId = getSinglePendingRequestId(pendingRequestIds);
  if (!requestId) return null;
  const shortcut = trimmed.toLowerCase();
  if (["1", "/1", "allow", "/allow", "y", "yes", "\u5141\u8BB8", "\u5141\u8BB8\u4E00\u6B21", "\u540C\u610F", "\u6279\u51C6"].includes(shortcut)) {
    return { requestId, allowed: true };
  }
  if (["2", "/2", "always", "/always", "allow-always", "/allow-always", "\u6C38\u4E45\u5141\u8BB8", "\u4E00\u76F4\u5141\u8BB8"].includes(shortcut)) {
    return { requestId, allowed: true, rule: "always" };
  }
  if (["3", "/3", "deny", "/deny", "n", "no", "\u62D2\u7EDD", "\u4E0D\u5141\u8BB8", "\u5426"].includes(shortcut)) {
    return { requestId, allowed: false };
  }
  return null;
}
function parsePermitCallbackData(data) {
  const parts = data.split(":");
  if (parts.length !== 3 || parts[0] !== "permit" || !parts[1]) return null;
  switch (parts[2]) {
    case "yes":
      return { requestId: parts[1], allowed: true };
    case "always":
      return { requestId: parts[1], allowed: true, rule: "always" };
    case "no":
      return { requestId: parts[1], allowed: false };
    default:
      return null;
  }
}
function formatPermissionInstructions(requestId) {
  return [
    "\u56DE\u590D 1 \u5141\u8BB8\u4E00\u6B21\uFF0C2 \u6C38\u4E45\u5141\u8BB8\uFF0C3 \u62D2\u7EDD\u3002",
    `\u4E5F\u53EF\u56DE\u590D /allow ${requestId}\u3001/always ${requestId}\u3001/deny ${requestId}\u3002`
  ].join("\n");
}
function formatPermissionDecisionStatus(decision) {
  if (!decision.allowed) return "\u274C \u5DF2\u62D2\u7EDD";
  return decision.rule === "always" ? "\u267E\uFE0F \u5DF2\u6C38\u4E45\u5141\u8BB8" : "\u2705 \u5DF2\u5141\u8BB8";
}

// adapters/common/session-store.ts
init_define_MACRO();
import * as fs2 from "node:fs";
import * as path2 from "node:path";
import * as os2 from "node:os";
function getDefaultPath() {
  const configDir = process.env.CLAUDE_CONFIG_DIR || path2.join(os2.homedir(), ".claude");
  return path2.join(configDir, "adapter-sessions.json");
}
var SessionStore = class {
  data;
  filePath;
  constructor(filePath) {
    this.filePath = filePath ?? getDefaultPath();
    this.data = this.load();
  }
  get(chatId) {
    this.refresh();
    return this.data[chatId] ?? null;
  }
  set(chatId, sessionId, workDir) {
    this.refresh();
    this.data[chatId] = { sessionId, workDir, updatedAt: Date.now() };
    this.save();
  }
  delete(chatId) {
    this.refresh();
    delete this.data[chatId];
    this.save();
  }
  deleteBySessionId(sessionId) {
    this.refresh();
    const removed = [];
    for (const [chatId, entry] of Object.entries(this.data)) {
      if (entry.sessionId !== sessionId) continue;
      delete this.data[chatId];
      removed.push(chatId);
    }
    if (removed.length > 0) {
      this.save();
    }
    return removed;
  }
  listAll() {
    this.refresh();
    return Object.entries(this.data).map(([chatId, entry]) => ({ chatId, ...entry }));
  }
  refresh() {
    this.data = this.load();
  }
  load() {
    try {
      return JSON.parse(fs2.readFileSync(this.filePath, "utf-8"));
    } catch {
      return {};
    }
  }
  save() {
    const dir = path2.dirname(this.filePath);
    fs2.mkdirSync(dir, { recursive: true });
    const tmp = `${this.filePath}.tmp.${Date.now()}`;
    fs2.writeFileSync(tmp, JSON.stringify(this.data, null, 2) + "\n");
    fs2.renameSync(tmp, this.filePath);
  }
};

// adapters/common/adapter-client.ts
init_define_MACRO();

// adapters/common/http-client.ts
init_define_MACRO();
import * as fs3 from "node:fs";
import * as os3 from "node:os";
import * as path3 from "node:path";
var AdapterHttpClient = class _AdapterHttpClient {
  httpBaseUrl;
  allowedProjectRoots;
  localAccessToken;
  /** Default timeout for HTTP requests (30 seconds) */
  static DEFAULT_TIMEOUT_MS = 3e4;
  constructor(wsUrl, options) {
    this.httpBaseUrl = wsUrl.replace(/^ws:/, "http:").replace(/^wss:/, "https:").replace(/\/$/, "");
    this.allowedProjectRoots = (options?.allowedProjectRoots ?? []).map(resolveExistingProjectPath).filter((value) => Boolean(value));
    this.localAccessToken = options?.localAccessToken?.trim() || process.env.CC_HAHA_LOCAL_ACCESS_TOKEN?.trim() || null;
  }
  request(pathname, init = {}) {
    const headers = new Headers(init.headers);
    if (this.localAccessToken) {
      headers.set("Authorization", `Bearer ${this.localAccessToken}`);
    }
    return fetch(`${this.httpBaseUrl}${pathname}`, { ...init, headers });
  }
  /** Create an AbortController with timeout */
  createTimeoutController(timeoutMs = _AdapterHttpClient.DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return { controller, timer };
  }
  async createSession(workDir) {
    const allowedWorkDir = this.resolveAllowedProjectPath(workDir);
    if (!allowedWorkDir) {
      throw new Error("Failed to create session: workDir is outside the configured project roots");
    }
    const { controller, timer } = this.createTimeoutController();
    try {
      const res = await this.request("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Omit permissionMode on purpose: the server falls back to the user's
        // global default mode at launch (ws/handler.ts). Hardcoding a mode here
        // would pin every IM-created session regardless of the user's setting.
        body: JSON.stringify({ workDir: allowedWorkDir }),
        signal: controller.signal
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Failed to create session: ${err.message}`);
      }
      const data = await res.json();
      return data.sessionId;
    } finally {
      clearTimeout(timer);
    }
  }
  async sessionExists(sessionId) {
    const { controller, timer } = this.createTimeoutController();
    try {
      const res = await this.request(`/api/sessions/${encodeURIComponent(sessionId)}`, {
        signal: controller.signal
      });
      if (res.status === 404) return false;
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Failed to check session: ${err.message}`);
      }
      const data = await res.json();
      return this.isSafeRemoteSession(data.status);
    } finally {
      clearTimeout(timer);
    }
  }
  async listRecentProjects() {
    const { controller, timer } = this.createTimeoutController();
    try {
      const res = await this.request("/api/sessions/recent-projects", {
        signal: controller.signal
      });
      if (!res.ok) {
        throw new Error(`Failed to list projects: ${res.statusText}`);
      }
      const data = await res.json();
      return data.projects.filter(
        (project) => this.resolveAllowedProjectPath(project.realPath || project.projectPath)
      );
    } finally {
      clearTimeout(timer);
    }
  }
  /**
   * Match a project by index (1-based) or fuzzy name from recent projects.
   * Returns { project, ambiguous[] } — ambiguous is set when multiple projects match.
   */
  async matchProject(query) {
    const resolvedDirectPath = resolveExistingProjectPath(query);
    if (resolvedDirectPath) {
      const directPath = this.resolveAllowedProjectPath(resolvedDirectPath);
      if (!directPath) return {};
      return {
        project: {
          projectPath: directPath,
          realPath: directPath,
          projectName: path3.basename(directPath) || directPath,
          isGit: fs3.existsSync(path3.join(directPath, ".git")),
          repoName: null,
          branch: null,
          modifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
          sessionCount: 0
        }
      };
    }
    const projects = await this.listRecentProjects();
    const num = parseInt(query, 10);
    if (!isNaN(num) && num >= 1 && num <= projects.length && String(num) === query.trim()) {
      return { project: projects[num - 1] };
    }
    const q = query.toLowerCase();
    const exact = projects.filter((p) => p.projectName.toLowerCase() === q);
    if (exact.length === 1) return { project: exact[0] };
    if (exact.length > 1) return { ambiguous: exact };
    const matches = projects.filter(
      (p) => p.projectName.toLowerCase().includes(q) || p.realPath.toLowerCase().includes(q)
    );
    if (matches.length === 1) return { project: matches[0] };
    if (matches.length > 1) return { ambiguous: matches };
    return {};
  }
  async getGitInfo(sessionId) {
    const { controller, timer } = this.createTimeoutController();
    try {
      const res = await this.request(`/api/sessions/${encodeURIComponent(sessionId)}/git-info`, {
        signal: controller.signal
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Failed to load git info: ${err.message}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }
  async getTasksForSession(sessionId) {
    const { controller, timer } = this.createTimeoutController();
    try {
      const res = await this.request(`/api/tasks/lists/${encodeURIComponent(sessionId)}`, {
        signal: controller.signal
      });
      if (!res.ok) {
        if (res.status === 404) return [];
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Failed to load tasks: ${err.message}`);
      }
      const data = await res.json();
      return Array.isArray(data.tasks) ? data.tasks : [];
    } finally {
      clearTimeout(timer);
    }
  }
  async listSessions(options) {
    if (options?.project && !this.resolveAllowedProjectPath(options.project)) {
      return { sessions: [], total: 0 };
    }
    const params = new URLSearchParams();
    if (options?.project) params.set("project", options.project);
    if (options?.limit !== void 0) params.set("limit", String(options.limit));
    if (options?.offset !== void 0) params.set("offset", String(options.offset));
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const { controller, timer } = this.createTimeoutController();
    try {
      const res = await this.request(`/api/sessions${suffix}`, {
        signal: controller.signal
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Failed to list sessions: ${err.message}`);
      }
      const data = await res.json();
      const sessions = data.sessions.filter((session) => this.isSafeRemoteSession({
        workDir: session.workDir,
        permissionMode: session.permissionMode
      }));
      return { sessions, total: sessions.length };
    } finally {
      clearTimeout(timer);
    }
  }
  async listProviders() {
    const { controller, timer } = this.createTimeoutController();
    try {
      const res = await this.request("/api/providers", {
        signal: controller.signal
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Failed to list providers: ${err.message}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }
  async activateProvider(providerId) {
    await this.postJson(`/api/providers/${encodeURIComponent(providerId)}/activate`);
  }
  async activateOfficialProvider() {
    await this.postJson("/api/providers/official");
  }
  async listModels() {
    const { controller, timer } = this.createTimeoutController();
    try {
      const res = await this.request("/api/models", {
        signal: controller.signal
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Failed to list models: ${err.message}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }
  async getCurrentModel() {
    const { controller, timer } = this.createTimeoutController();
    try {
      const res = await this.request("/api/models/current", {
        signal: controller.signal
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Failed to get current model: ${err.message}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }
  async setCurrentModel(modelId) {
    await this.putJson("/api/models/current", { modelId });
  }
  async listSkills(cwd) {
    const allowedCwd = this.resolveAllowedProjectPath(cwd);
    if (!allowedCwd) {
      throw new Error("Failed to list skills: cwd is outside the configured project roots");
    }
    const params = new URLSearchParams({ cwd: allowedCwd });
    const { controller, timer } = this.createTimeoutController();
    try {
      const res = await this.request(`/api/skills?${params.toString()}`, {
        signal: controller.signal
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Failed to list skills: ${err.message}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }
  async postJson(pathname) {
    const { controller, timer } = this.createTimeoutController();
    try {
      const res = await this.request(pathname, {
        method: "POST",
        signal: controller.signal
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Request failed: ${err.message}`);
      }
    } finally {
      clearTimeout(timer);
    }
  }
  async putJson(pathname, body) {
    const { controller, timer } = this.createTimeoutController();
    try {
      const res = await this.request(pathname, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Request failed: ${err.message}`);
      }
    } finally {
      clearTimeout(timer);
    }
  }
  resolveAllowedProjectPath(value) {
    if (!value) return null;
    const resolved = resolveExistingProjectPath(value);
    if (!resolved || !isPathWithinAllowedRoots(resolved, this.allowedProjectRoots)) {
      return null;
    }
    return resolved;
  }
  isSafeRemoteSession(status) {
    if (!status?.workDir || status.permissionMode === "bypassPermissions") {
      return false;
    }
    return Boolean(this.resolveAllowedProjectPath(status.workDir));
  }
};
function isPathWithinAllowedRoots(target, roots) {
  if (roots.length === 0) return false;
  for (const root of roots) {
    const relative3 = path3.relative(root, target);
    if (relative3 === "" || !relative3.startsWith("..") && !path3.isAbsolute(relative3)) {
      return true;
    }
  }
  return false;
}
function resolveExistingProjectPath(query) {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const expanded = trimmed === "~" ? os3.homedir() : trimmed.startsWith("~/") ? path3.join(os3.homedir(), trimmed.slice(2)) : trimmed;
  if (!path3.isAbsolute(expanded)) return null;
  try {
    const realPath = fs3.realpathSync(expanded);
    return fs3.statSync(realPath).isDirectory() ? realPath : null;
  } catch {
    return null;
  }
}

// adapters/common/adapter-client.ts
function createAdapterClient(config, platformConfig) {
  const { defaultWorkDir, allowedProjectRoots } = resolveAdapterWorkspace(config, platformConfig);
  return {
    httpClient: new AdapterHttpClient(config.serverUrl, { allowedProjectRoots }),
    defaultWorkDir
  };
}

// adapters/common/session-recovery.ts
init_define_MACRO();
function resetStaleBridge(chatId, bridge, clearTransientState) {
  if (!bridge.hasSession(chatId)) return;
  bridge.resetSession(chatId);
  clearTransientState?.();
}
async function restoreStoredSessionBinding({
  chatId,
  bridge,
  sessionStore,
  httpClient,
  onServerMessage,
  logPrefix,
  clearTransientState
}) {
  const stored = sessionStore.get(chatId);
  if (!stored) {
    resetStaleBridge(chatId, bridge, clearTransientState);
    return null;
  }
  const currentSessionId = bridge.getSessionId(chatId);
  if (currentSessionId && currentSessionId !== stored.sessionId) {
    resetStaleBridge(chatId, bridge, clearTransientState);
  }
  if (bridge.isSessionOpen(chatId, stored.sessionId)) {
    return stored;
  }
  let exists = true;
  try {
    exists = await httpClient.sessionExists(stored.sessionId);
  } catch (err) {
    console.warn(
      `${logPrefix} Failed to verify stored session ${stored.sessionId}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  if (!exists) {
    sessionStore.delete(chatId);
    const hadBridgeSession = bridge.hasSession(chatId);
    resetStaleBridge(chatId, bridge, clearTransientState);
    if (!hadBridgeSession) clearTransientState?.();
    return null;
  }
  bridge.connectSession(chatId, stored.sessionId);
  bridge.onServerMessage(chatId, onServerMessage);
  const opened = await bridge.waitForOpen(chatId);
  return opened ? stored : null;
}

// adapters/common/pairing.ts
init_define_MACRO();
import * as fs4 from "node:fs";
import * as os4 from "node:os";
import * as path4 from "node:path";
import * as crypto from "node:crypto";
var RATE_LIMIT_WINDOW_MS = 5 * 60 * 1e3;
var RATE_LIMIT_MAX_ATTEMPTS = 5;
var failedAttempts = /* @__PURE__ */ new Map();
function isRateLimited(userId) {
  const key = String(userId);
  const record = failedAttempts.get(key);
  if (!record) return false;
  if (Date.now() - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    failedAttempts.delete(key);
    return false;
  }
  return record.count >= RATE_LIMIT_MAX_ATTEMPTS;
}
function recordFailedAttempt(userId) {
  const key = String(userId);
  const record = failedAttempts.get(key);
  if (!record || Date.now() - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    failedAttempts.set(key, { count: 1, firstAttempt: Date.now() });
  } else {
    record.count++;
  }
}
var CODE_TTL_MS = 60 * 60 * 1e3;
function getConfigPath2() {
  const configDir = process.env.CLAUDE_CONFIG_DIR || path4.join(os4.homedir(), ".claude");
  return path4.join(configDir, "adapters.json");
}
function readConfigFile() {
  try {
    return JSON.parse(fs4.readFileSync(getConfigPath2(), "utf-8"));
  } catch {
    return {};
  }
}
function writeConfigFile(data) {
  const filePath = getConfigPath2();
  const dir = path4.dirname(filePath);
  if (!fs4.existsSync(dir)) fs4.mkdirSync(dir, { recursive: true, mode: 448 });
  const tmp = `${filePath}.tmp.${crypto.randomBytes(8).toString("hex")}`;
  fs4.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", { encoding: "utf-8", mode: 384 });
  fs4.renameSync(tmp, filePath);
}
function isPaired(platform, userId, config) {
  const platformConfig = config[platform] ?? {};
  const allowedUsers = platformConfig.allowedUsers ?? [];
  const pairedUsers = platformConfig.pairedUsers ?? [];
  if (allowedUsers.length > 0 && allowedUsers.includes(userId)) return true;
  if (pairedUsers.length === 0 && allowedUsers.length === 0) return false;
  return pairedUsers.some((p) => String(p.userId) === String(userId));
}
function tryPair(messageText, senderInfo, platform) {
  const file = readConfigFile();
  const pairing = file.pairing ?? { code: null, expiresAt: null, createdAt: null };
  if (isRateLimited(senderInfo.userId)) return false;
  if (!pairing.code || !pairing.expiresAt) return false;
  if (Date.now() > pairing.expiresAt) return false;
  const input = messageText.trim().toUpperCase();
  if (input !== pairing.code.toUpperCase()) {
    recordFailedAttempt(senderInfo.userId);
    return false;
  }
  const platformConfig = file[platform] ?? {};
  const pairedUsers = platformConfig.pairedUsers ?? [];
  const exists = pairedUsers.some((p) => String(p.userId) === String(senderInfo.userId));
  if (!exists) {
    pairedUsers.push({
      userId: senderInfo.userId,
      displayName: senderInfo.displayName,
      pairedAt: Date.now()
    });
  }
  file[platform] = { ...platformConfig, pairedUsers };
  file.pairing = { code: null, expiresAt: null, createdAt: null };
  writeConfigFile(file);
  return true;
}
function isAllowedUser(platform, userId) {
  try {
    const cfgFile = readConfigFile();
    return isPaired(platform, userId, cfgFile);
  } catch {
    return false;
  }
}

// adapters/common/attachment/attachment-store.ts
init_define_MACRO();
import * as fs5 from "node:fs/promises";
import * as fsSync from "node:fs";
import * as path5 from "node:path";
import * as os5 from "node:os";
var DEFAULT_RETENTION_MS = 24 * 60 * 60 * 1e3;
var DEFAULT_ORPHAN_GRACE_MS = 10 * 60 * 1e3;
function defaultRoot() {
  return path5.join(os5.homedir(), ".claude", "im-downloads");
}
function sanitizeFilename(name) {
  const base = path5.basename(name || "").replace(/[\x00-\x1f]/g, "");
  const cleaned = base.replace(/[\/\\]/g, "_").replace(/\.\.+/g, "_");
  return cleaned.trim() || "unnamed";
}
var AttachmentStore = class {
  root;
  retentionMs;
  orphanGraceMs;
  constructor(config) {
    this.root = config?.root ?? defaultRoot();
    this.retentionMs = config?.retentionMs ?? DEFAULT_RETENTION_MS;
    this.orphanGraceMs = config?.orphanGraceMs ?? DEFAULT_ORPHAN_GRACE_MS;
  }
  /** Compute the target path. Creates parent dirs on demand.
   *  If a file with the same name already exists, prefix with a timestamp
   *  to avoid clobbering. */
  resolvePath(platform, sessionId, name) {
    const safeSession = sanitizeFilename(sessionId);
    const dir = path5.join(this.root, platform, safeSession);
    fsSync.mkdirSync(dir, { recursive: true });
    const safeName = sanitizeFilename(name);
    const candidate = path5.join(dir, safeName);
    if (!fsSync.existsSync(candidate)) return candidate;
    const { name: base, ext } = path5.parse(safeName);
    const rand = Math.random().toString(36).slice(2, 8);
    return path5.join(dir, `${base}-${Date.now()}-${rand}${ext}`);
  }
  /** Write atomically: stream to {target}.part, then rename. */
  async write(target, data) {
    await fs5.mkdir(path5.dirname(target), { recursive: true });
    const tmp = `${target}.${process.pid}.${Date.now()}.part`;
    await fs5.writeFile(tmp, data);
    await fs5.rename(tmp, target);
    return target;
  }
  /** Remove files older than retentionMs. Returns summary. */
  async gc() {
    let removed = 0;
    let bytes = 0;
    const now = Date.now();
    const walk = async (dir) => {
      let entries;
      try {
        entries = await fs5.readdir(dir, { withFileTypes: true, encoding: "utf8" });
      } catch {
        return;
      }
      for (const entry of entries) {
        const full = path5.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else if (entry.isFile()) {
          try {
            const stat2 = await fs5.stat(full);
            const age = now - stat2.mtimeMs;
            const isOrphanPart = entry.name.endsWith(".part");
            const threshold = isOrphanPart ? this.orphanGraceMs : this.retentionMs;
            if (age > threshold) {
              bytes += stat2.size;
              await fs5.unlink(full);
              removed++;
            }
          } catch {
          }
        }
      }
    };
    await walk(this.root).catch(() => {
    });
    return { removed, bytes };
  }
};

// adapters/common/attachment/attachment-limits.ts
init_define_MACRO();
var IMAGE_MAX_BYTES = 10 * 1024 * 1024;
var FILE_MAX_BYTES = 30 * 1024 * 1024;
var IMAGE_MIME_WHITELIST = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp"
];
function formatMb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}
function checkAttachmentLimit(kind, size, mime) {
  if (kind === "image") {
    if (size > IMAGE_MAX_BYTES) {
      return {
        ok: false,
        reason: "too_large",
        hint: `\u{1F4CE} \u56FE\u7247\u8FC7\u5927(${formatMb(size)} MB),\u8BF7\u63A7\u5236\u5728 10 MB \u4EE5\u5185`
      };
    }
    if (mime && !IMAGE_MIME_WHITELIST.includes(mime)) {
      return {
        ok: false,
        reason: "unsupported_mime",
        hint: `\u{1F4CE} \u6682\u4E0D\u652F\u6301\u6B64\u56FE\u7247\u683C\u5F0F(${mime})`
      };
    }
    return { ok: true };
  }
  if (size > FILE_MAX_BYTES) {
    return {
      ok: false,
      reason: "too_large",
      hint: `\u{1F4CE} \u6587\u4EF6\u8FC7\u5927(${formatMb(size)} MB),\u8BF7\u63A7\u5236\u5728 30 MB \u4EE5\u5185`
    };
  }
  return { ok: true };
}

export {
  require_permessage_deflate,
  require_receiver,
  require_sender,
  require_extension,
  require_websocket,
  require_stream,
  require_subprotocol,
  require_websocket_server,
  wrapper_default,
  WsBridge,
  MessageDedup,
  enqueue,
  loadConfig,
  splitMessage,
  convertMarkdownTablesToBullets,
  formatPermissionRequest,
  truncateInput,
  formatImHelp,
  formatImStatus,
  parsePermissionCommand,
  parsePermitCallbackData,
  formatPermissionInstructions,
  formatPermissionDecisionStatus,
  SessionStore,
  createAdapterClient,
  restoreStoredSessionBinding,
  tryPair,
  isAllowedUser,
  AttachmentStore,
  IMAGE_MAX_BYTES,
  IMAGE_MIME_WHITELIST,
  checkAttachmentLimit
};
//# sourceMappingURL=chunk-XHLXXLZD.mjs.map
