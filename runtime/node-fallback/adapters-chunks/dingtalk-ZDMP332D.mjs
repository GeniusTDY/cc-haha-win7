import { createRequire as __nodePortCreateRequire } from 'node:module';
import { fileURLToPath as __nodePortF2P } from 'node:url';
import { dirname as __nodePortDirname } from 'node:path';
var require = __nodePortCreateRequire(import.meta.url);
var __filename = __nodePortF2P(import.meta.url);
var __dirname = __nodePortDirname(__filename);
process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";
import {
  ProjectSelectionController,
  formatProjectSelectionOutcome,
  require_dist,
  require_follow_redirects,
  require_form_data
} from "./chunk-3HZCUVP3.mjs";
import {
  MessageBuffer
} from "./chunk-L6M5NUCS.mjs";
import {
  AttachmentStore,
  MessageDedup,
  SessionStore,
  WsBridge,
  checkAttachmentLimit,
  createAdapterClient,
  enqueue,
  formatImHelp,
  formatImStatus,
  formatPermissionDecisionStatus,
  formatPermissionInstructions,
  formatPermissionRequest,
  isAllowedUser,
  loadConfig,
  parsePermissionCommand,
  parsePermitCallbackData,
  restoreStoredSessionBinding,
  splitMessage,
  truncateInput,
  tryPair,
  wrapper_default
} from "./chunk-YMSHMHGN.mjs";
import "./chunk-2ZSSHQMO.mjs";
import {
  __export,
  __toESM,
  init_define_MACRO
} from "./chunk-GSBHELYD.mjs";

// adapters/dingtalk/index.ts
init_define_MACRO();
import path2 from "node:path";

// adapters/node_modules/dingtalk-stream/dist/index.mjs
init_define_MACRO();

// adapters/node_modules/dingtalk-stream/dist/constants.mjs
init_define_MACRO();
var GATEWAY_URL = "https://api.dingtalk.com/v1.0/gateway/connections/open";
var GET_TOKEN_URL = "https://oapi.dingtalk.com/gettoken";
var TOPIC_ROBOT = "/v1.0/im/bot/messages/get";
var TOPIC_CARD = "/v1.0/card/instances/callback";

// adapters/node_modules/dingtalk-stream/dist/client.mjs
init_define_MACRO();

// adapters/node_modules/axios/index.js
init_define_MACRO();

// adapters/node_modules/axios/lib/axios.js
init_define_MACRO();

// adapters/node_modules/axios/lib/utils.js
init_define_MACRO();

// adapters/node_modules/axios/lib/helpers/bind.js
init_define_MACRO();
function bind(fn, thisArg) {
  return function wrap() {
    return fn.apply(thisArg, arguments);
  };
}

// adapters/node_modules/axios/lib/utils.js
var { toString } = Object.prototype;
var { getPrototypeOf } = Object;
var { iterator, toStringTag } = Symbol;
var hasOwnProperty = (({ hasOwnProperty: hasOwnProperty2 }) => (obj, prop) => hasOwnProperty2.call(obj, prop))(Object.prototype);
var hasOwnInPrototypeChain = (thing, prop) => {
  let obj = thing;
  const seen = [];
  while (obj != null && obj !== Object.prototype) {
    if (seen.indexOf(obj) !== -1) {
      return false;
    }
    seen.push(obj);
    if (hasOwnProperty(obj, prop)) {
      return true;
    }
    obj = getPrototypeOf(obj);
  }
  return false;
};
var getSafeProp = (obj, prop) => obj != null && hasOwnInPrototypeChain(obj, prop) ? obj[prop] : void 0;
var kindOf = /* @__PURE__ */ ((cache) => (thing) => {
  const str = toString.call(thing);
  return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null));
var kindOfTest = (type) => {
  type = type.toLowerCase();
  return (thing) => kindOf(thing) === type;
};
var typeOfTest = (type) => (thing) => typeof thing === type;
var { isArray } = Array;
var isUndefined = typeOfTest("undefined");
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}
var isArrayBuffer = kindOfTest("ArrayBuffer");
function isArrayBufferView(val) {
  let result;
  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
    result = ArrayBuffer.isView(val);
  } else {
    result = val && val.buffer && isArrayBuffer(val.buffer);
  }
  return result;
}
var isString = typeOfTest("string");
var isFunction = typeOfTest("function");
var isNumber = typeOfTest("number");
var isObject = (thing) => thing !== null && typeof thing === "object";
var isBoolean = (thing) => thing === true || thing === false;
var isPlainObject = (val) => {
  if (!isObject(val)) {
    return false;
  }
  const prototype2 = getPrototypeOf(val);
  return (prototype2 === null || prototype2 === Object.prototype || getPrototypeOf(prototype2) === null) && // Treat any genuine (non-Object.prototype-polluted) Symbol.toStringTag or
  // Symbol.iterator as evidence the value is a tagged/iterable type rather
  // than a plain object, while ignoring keys injected onto Object.prototype.
  !hasOwnInPrototypeChain(val, toStringTag) && !hasOwnInPrototypeChain(val, iterator);
};
var isEmptyObject = (val) => {
  if (!isObject(val) || isBuffer(val)) {
    return false;
  }
  try {
    return Object.keys(val).length === 0 && Object.getPrototypeOf(val) === Object.prototype;
  } catch (e) {
    return false;
  }
};
var isDate = kindOfTest("Date");
var isFile = kindOfTest("File");
var isReactNativeBlob = (value) => {
  return !!(value && typeof value.uri !== "undefined");
};
var isReactNative = (formData) => formData && typeof formData.getParts !== "undefined";
var isBlob = kindOfTest("Blob");
var isFileList = kindOfTest("FileList");
var isSet = kindOfTest("Set");
var isStream = (val) => isObject(val) && isFunction(val.pipe);
function getGlobal() {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof self !== "undefined") return self;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
  return {};
}
var G = getGlobal();
var FormDataCtor = typeof G.FormData !== "undefined" ? G.FormData : void 0;
var isFormData = (thing) => {
  if (!thing) return false;
  if (FormDataCtor && thing instanceof FormDataCtor) return true;
  const proto = getPrototypeOf(thing);
  if (!proto || proto === Object.prototype) return false;
  if (!isFunction(thing.append)) return false;
  const kind = kindOf(thing);
  return kind === "formdata" || // detect form-data instance
  kind === "object" && isFunction(thing.toString) && thing.toString() === "[object FormData]";
};
var isURLSearchParams = kindOfTest("URLSearchParams");
var [isReadableStream, isRequest, isResponse, isHeaders] = [
  "ReadableStream",
  "Request",
  "Response",
  "Headers"
].map(kindOfTest);
var trim = (str) => {
  return str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
};
function forEach(obj, fn, { allOwnKeys = false } = {}) {
  if (obj === null || typeof obj === "undefined") {
    return;
  }
  let i;
  let l;
  if (typeof obj !== "object") {
    obj = [obj];
  }
  if (isArray(obj)) {
    for (i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    if (isBuffer(obj)) {
      return;
    }
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;
    for (i = 0; i < len; i++) {
      key = keys[i];
      fn.call(null, obj[key], key, obj);
    }
  }
}
function findKey(obj, key) {
  if (isBuffer(obj)) {
    return null;
  }
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}
var _global = (() => {
  if (typeof globalThis !== "undefined") return globalThis;
  return typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : global;
})();
var isContextDefined = (context) => !isUndefined(context) && context !== _global;
function merge(...objs) {
  const { caseless, skipUndefined } = isContextDefined(this) && this || {};
  const result = {};
  const assignValue = (val, key) => {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return;
    }
    const targetKey = caseless && typeof key === "string" && findKey(result, key) || key;
    const existing = hasOwnProperty(result, targetKey) ? result[targetKey] : void 0;
    if (isPlainObject(existing) && isPlainObject(val)) {
      result[targetKey] = merge(existing, val);
    } else if (isPlainObject(val)) {
      result[targetKey] = merge({}, val);
    } else if (isArray(val)) {
      result[targetKey] = val.slice();
    } else if (!skipUndefined || !isUndefined(val)) {
      result[targetKey] = val;
    }
  };
  for (let i = 0, l = objs.length; i < l; i++) {
    const source = objs[i];
    if (!source || isBuffer(source)) {
      continue;
    }
    forEach(source, assignValue);
    if (typeof source !== "object" || isArray(source)) {
      continue;
    }
    const symbols = Object.getOwnPropertySymbols(source);
    for (let j = 0; j < symbols.length; j++) {
      const symbol = symbols[j];
      if (propertyIsEnumerable.call(source, symbol)) {
        assignValue(source[symbol], symbol);
      }
    }
  }
  return result;
}
var extend = (a, b, thisArg, { allOwnKeys } = {}) => {
  forEach(
    b,
    (val, key) => {
      if (thisArg && isFunction(val)) {
        Object.defineProperty(a, key, {
          // Null-proto descriptor so a polluted Object.prototype.get cannot
          // hijack defineProperty's accessor-vs-data resolution.
          __proto__: null,
          value: bind(val, thisArg),
          writable: true,
          enumerable: true,
          configurable: true
        });
      } else {
        Object.defineProperty(a, key, {
          __proto__: null,
          value: val,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    },
    { allOwnKeys }
  );
  return a;
};
var stripBOM = (content) => {
  if (content.charCodeAt(0) === 65279) {
    content = content.slice(1);
  }
  return content;
};
var inherits = (constructor, superConstructor, props, descriptors) => {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  Object.defineProperty(constructor.prototype, "constructor", {
    __proto__: null,
    value: constructor,
    writable: true,
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(constructor, "super", {
    __proto__: null,
    value: superConstructor.prototype
  });
  props && Object.assign(constructor.prototype, props);
};
var toFlatObject = (sourceObj, destObj, filter2, propFilter) => {
  let props;
  let i;
  let prop;
  const merged = {};
  destObj = destObj || {};
  if (sourceObj == null) return destObj;
  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = filter2 !== false && getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter2 || filter2(sourceObj, destObj)) && sourceObj !== Object.prototype);
  return destObj;
};
var endsWith = (str, searchString, position) => {
  str = String(str);
  if (position === void 0 || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  const lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
};
var toArray = (thing) => {
  if (!thing) return null;
  if (isArray(thing)) return thing;
  let i = thing.length;
  if (!isNumber(i)) return null;
  const arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
};
var isTypedArray = /* @__PURE__ */ ((TypedArray) => {
  return (thing) => {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== "undefined" && getPrototypeOf(Uint8Array));
var forEachEntry = (obj, fn) => {
  const generator = obj && obj[iterator];
  const _iterator = generator.call(obj);
  let result;
  while ((result = _iterator.next()) && !result.done) {
    const pair = result.value;
    fn.call(obj, pair[0], pair[1]);
  }
};
var matchAll = (regExp, str) => {
  let matches;
  const arr = [];
  while ((matches = regExp.exec(str)) !== null) {
    arr.push(matches);
  }
  return arr;
};
var isHTMLForm = kindOfTest("HTMLFormElement");
var toCamelCase = (str) => {
  return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function replacer(m, p1, p2) {
    return p1.toUpperCase() + p2;
  });
};
var { propertyIsEnumerable } = Object.prototype;
var isRegExp = kindOfTest("RegExp");
var reduceDescriptors = (obj, reducer) => {
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  const reducedDescriptors = {};
  forEach(descriptors, (descriptor, name) => {
    let ret;
    if ((ret = reducer(descriptor, name, obj)) !== false) {
      reducedDescriptors[name] = ret || descriptor;
    }
  });
  Object.defineProperties(obj, reducedDescriptors);
};
var freezeMethods = (obj) => {
  reduceDescriptors(obj, (descriptor, name) => {
    if (isFunction(obj) && ["arguments", "caller", "callee"].includes(name)) {
      return false;
    }
    const value = obj[name];
    if (!isFunction(value)) return;
    descriptor.enumerable = false;
    if ("writable" in descriptor) {
      descriptor.writable = false;
      return;
    }
    if (!descriptor.set) {
      descriptor.set = () => {
        throw Error("Can not rewrite read-only method '" + name + "'");
      };
    }
  });
};
var toObjectSet = (arrayOrString, delimiter) => {
  const obj = {};
  const define = (arr) => {
    arr.forEach((value) => {
      obj[value] = true;
    });
  };
  isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));
  return obj;
};
var noop = () => {
};
var toFiniteNumber = (value, defaultValue) => {
  return value != null && Number.isFinite(value = +value) ? value : defaultValue;
};
function isSpecCompliantForm(thing) {
  return !!(thing && isFunction(thing.append) && thing[toStringTag] === "FormData" && thing[iterator]);
}
var toJSONObject = (obj) => {
  const visited = /* @__PURE__ */ new WeakSet();
  const visit = (source) => {
    if (isObject(source)) {
      if (visited.has(source)) {
        return;
      }
      if (isBuffer(source)) {
        return source;
      }
      if (!("toJSON" in source)) {
        visited.add(source);
        let target;
        if (isSet(source)) {
          target = [];
          for (const value of source) {
            const reducedValue = visit(value);
            !isUndefined(reducedValue) && target.push(reducedValue);
          }
        } else {
          target = isArray(source) ? [] : {};
          forEach(source, (value, key) => {
            const reducedValue = visit(value);
            !isUndefined(reducedValue) && (target[key] = reducedValue);
          });
        }
        visited.delete(source);
        return target;
      }
    }
    return source;
  };
  return visit(obj);
};
var isAsyncFn = kindOfTest("AsyncFunction");
var isThenable = (thing) => thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch);
var _setImmediate = ((setImmediateSupported, postMessageSupported) => {
  if (setImmediateSupported) {
    return setImmediate;
  }
  return postMessageSupported ? ((token, callbacks) => {
    _global.addEventListener(
      "message",
      ({ source, data }) => {
        if (source === _global && data === token) {
          callbacks.length && callbacks.shift()();
        }
      },
      false
    );
    return (cb) => {
      callbacks.push(cb);
      _global.postMessage(token, "*");
    };
  })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
})(typeof setImmediate === "function", isFunction(_global.postMessage));
var asap = typeof queueMicrotask !== "undefined" ? queueMicrotask.bind(_global) : typeof process !== "undefined" && process.nextTick || _setImmediate;
var isIterable = (thing) => thing != null && isFunction(thing[iterator]);
var isSafeIterable = (thing) => thing != null && hasOwnInPrototypeChain(thing, iterator) && isIterable(thing);
var utils_default = {
  isArray,
  isArrayBuffer,
  isBuffer,
  isFormData,
  isArrayBufferView,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isPlainObject,
  isEmptyObject,
  isReadableStream,
  isRequest,
  isResponse,
  isHeaders,
  isUndefined,
  isDate,
  isFile,
  isReactNativeBlob,
  isReactNative,
  isBlob,
  isRegExp,
  isFunction,
  isStream,
  isURLSearchParams,
  isTypedArray,
  isFileList,
  forEach,
  merge,
  extend,
  trim,
  stripBOM,
  inherits,
  toFlatObject,
  kindOf,
  kindOfTest,
  endsWith,
  toArray,
  forEachEntry,
  matchAll,
  isHTMLForm,
  hasOwnProperty,
  hasOwnProp: hasOwnProperty,
  // an alias to avoid ESLint no-prototype-builtins detection
  hasOwnInPrototypeChain,
  getSafeProp,
  reduceDescriptors,
  freezeMethods,
  toObjectSet,
  toCamelCase,
  noop,
  toFiniteNumber,
  findKey,
  global: _global,
  isContextDefined,
  isSpecCompliantForm,
  toJSONObject,
  isAsyncFn,
  isThenable,
  setImmediate: _setImmediate,
  asap,
  isIterable,
  isSafeIterable
};

// adapters/node_modules/axios/lib/core/Axios.js
init_define_MACRO();

// adapters/node_modules/axios/lib/helpers/buildURL.js
init_define_MACRO();

// adapters/node_modules/axios/lib/helpers/AxiosURLSearchParams.js
init_define_MACRO();

// adapters/node_modules/axios/lib/helpers/toFormData.js
init_define_MACRO();

// adapters/node_modules/axios/lib/core/AxiosError.js
init_define_MACRO();

// adapters/node_modules/axios/lib/core/AxiosHeaders.js
init_define_MACRO();

// adapters/node_modules/axios/lib/helpers/parseHeaders.js
init_define_MACRO();
var ignoreDuplicateOf = utils_default.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]);
var parseHeaders_default = (rawHeaders) => {
  const parsed = {};
  let key;
  let val;
  let i;
  rawHeaders && rawHeaders.split("\n").forEach(function parser(line) {
    i = line.indexOf(":");
    key = line.substring(0, i).trim().toLowerCase();
    val = line.substring(i + 1).trim();
    const hasKey = utils_default.hasOwnProp(parsed, key);
    if (!key || hasKey && utils_default.hasOwnProp(ignoreDuplicateOf, key)) {
      return;
    }
    if (key === "set-cookie") {
      if (hasKey) {
        parsed[key].push(val);
      } else {
        parsed[key] = [val];
      }
    } else {
      parsed[key] = hasKey ? parsed[key] + ", " + val : val;
    }
  });
  return parsed;
};

// adapters/node_modules/axios/lib/helpers/sanitizeHeaderValue.js
init_define_MACRO();
function trimSPorHTAB(str) {
  let start2 = 0;
  let end = str.length;
  while (start2 < end) {
    const code = str.charCodeAt(start2);
    if (code !== 9 && code !== 32) {
      break;
    }
    start2 += 1;
  }
  while (end > start2) {
    const code = str.charCodeAt(end - 1);
    if (code !== 9 && code !== 32) {
      break;
    }
    end -= 1;
  }
  return start2 === 0 && end === str.length ? str : str.slice(start2, end);
}
var INVALID_UNICODE_HEADER_VALUE_CHARS = new RegExp("[\\u0000-\\u0008\\u000a-\\u001f\\u007f]+", "g");
var INVALID_BYTE_STRING_HEADER_VALUE_CHARS = new RegExp("[^\\u0009\\u0020-\\u007e\\u0080-\\u00ff]+", "g");
function sanitizeValue(value, invalidChars) {
  if (utils_default.isArray(value)) {
    return value.map((item) => sanitizeValue(item, invalidChars));
  }
  return trimSPorHTAB(String(value).replace(invalidChars, ""));
}
var sanitizeHeaderValue = (value) => sanitizeValue(value, INVALID_UNICODE_HEADER_VALUE_CHARS);
var sanitizeByteStringHeaderValue = (value) => sanitizeValue(value, INVALID_BYTE_STRING_HEADER_VALUE_CHARS);
function toByteStringHeaderObject(headers) {
  const byteStringHeaders = /* @__PURE__ */ Object.create(null);
  utils_default.forEach(headers.toJSON(), (value, header) => {
    byteStringHeaders[header] = sanitizeByteStringHeaderValue(value);
  });
  return byteStringHeaders;
}

// adapters/node_modules/axios/lib/core/AxiosHeaders.js
var $internals = /* @__PURE__ */ Symbol("internals");
function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}
function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }
  return utils_default.isArray(value) ? value.map(normalizeValue) : sanitizeHeaderValue(String(value));
}
function parseTokens(str) {
  const tokens = /* @__PURE__ */ Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match;
  while (match = tokensRE.exec(str)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}
var parameterNameRE = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
function trimOWS(value) {
  let start2 = 0;
  let end = value.length;
  while (start2 < end) {
    const code = value.charCodeAt(start2);
    if (code !== 9 && code !== 32) {
      break;
    }
    start2 += 1;
  }
  while (end > start2) {
    const code = value.charCodeAt(end - 1);
    if (code !== 9 && code !== 32) {
      break;
    }
    end -= 1;
  }
  return start2 === 0 && end === value.length ? value : value.slice(start2, end);
}
function decodeQuotedString(value) {
  const last = value.length - 1;
  if (last < 1 || value.charCodeAt(0) !== 34 || value.charCodeAt(last) !== 34) {
    return value;
  }
  let decoded = "";
  for (let i = 1; i < last; i++) {
    const code = value.charCodeAt(i);
    if (code === 34) {
      return value;
    }
    if (code === 92) {
      i += 1;
      if (i >= last) {
        return value;
      }
    }
    decoded += value[i];
  }
  return decoded;
}
function parseParameters(value) {
  const parameters = /* @__PURE__ */ Object.create(null);
  const str = String(value);
  let start2 = 0;
  let quoted = false;
  let escaped = false;
  function parseParameter(end) {
    const part = trimOWS(str.slice(start2, end));
    const equals = part.indexOf("=");
    if (equals < 1) {
      return;
    }
    const name = trimOWS(part.slice(0, equals));
    if (!parameterNameRE.test(name)) {
      return;
    }
    const normalizedName = name.toLowerCase();
    if (normalizedName === "__proto__" || normalizedName === "constructor" || normalizedName === "prototype") {
      return;
    }
    const parameterValue = trimOWS(part.slice(equals + 1));
    parameters[normalizedName] = decodeQuotedString(parameterValue);
  }
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (quoted) {
      if (escaped) {
        escaped = false;
      } else if (code === 92) {
        escaped = true;
      } else if (code === 34) {
        quoted = false;
      }
    } else if (code === 34) {
      quoted = true;
    } else if (code === 44 || code === 59) {
      parseParameter(i);
      start2 = i + 1;
    }
  }
  parseParameter(str.length);
  return parameters;
}
var isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());
function matchHeaderValue(context, value, header, filter2, isHeaderNameFilter) {
  if (utils_default.isFunction(filter2)) {
    return filter2.call(this, value, header);
  }
  if (isHeaderNameFilter) {
    value = header;
  }
  if (!utils_default.isString(value)) return;
  if (utils_default.isString(filter2)) {
    return value.indexOf(filter2) !== -1;
  }
  if (utils_default.isRegExp(filter2)) {
    return filter2.test(value);
  }
}
function formatHeader(header) {
  return header.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
    return char.toUpperCase() + str;
  });
}
function buildAccessors(obj, header) {
  const accessorName = utils_default.toCamelCase(" " + header);
  ["get", "set", "has"].forEach((methodName) => {
    Object.defineProperty(obj, methodName + accessorName, {
      // Null-proto descriptor so a polluted Object.prototype.get cannot turn
      // this data descriptor into an accessor descriptor on the way in.
      __proto__: null,
      value: function(arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true
    });
  });
}
var AxiosHeaders = class {
  constructor(headers) {
    headers && this.set(headers);
  }
  set(header, valueOrRewrite, rewrite) {
    const self2 = this;
    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);
      if (!lHeader) {
        return;
      }
      const key = utils_default.findKey(self2, lHeader);
      if (!key || self2[key] === void 0 || _rewrite === true || _rewrite === void 0 && self2[key] !== false) {
        self2[key || _header] = normalizeValue(_value);
      }
    }
    const setHeaders = (headers, _rewrite) => utils_default.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));
    if (utils_default.isPlainObject(header) || header instanceof this.constructor) {
      setHeaders(header, valueOrRewrite);
    } else if (utils_default.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
      setHeaders(parseHeaders_default(header), valueOrRewrite);
    } else if (utils_default.isObject(header) && utils_default.isSafeIterable(header)) {
      let obj = /* @__PURE__ */ Object.create(null), dest, key;
      for (const entry of header) {
        if (!utils_default.isArray(entry)) {
          throw new TypeError("Object iterator must return a key-value pair");
        }
        key = entry[0];
        if (utils_default.hasOwnProp(obj, key)) {
          dest = obj[key];
          obj[key] = utils_default.isArray(dest) ? [...dest, entry[1]] : [dest, entry[1]];
        } else {
          obj[key] = entry[1];
        }
      }
      setHeaders(obj, valueOrRewrite);
    } else {
      header != null && setHeader(valueOrRewrite, header, rewrite);
    }
    return this;
  }
  get(header, parser) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils_default.findKey(this, header);
      if (key) {
        const value = this[key];
        if (!parser) {
          return value;
        }
        if (parser === true) {
          return parseTokens(value);
        }
        if (utils_default.isFunction(parser)) {
          return parser.call(this, value, key);
        }
        if (utils_default.isRegExp(parser)) {
          return parser.exec(value);
        }
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(header, matcher) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils_default.findKey(this, header);
      return !!(key && this[key] !== void 0 && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }
    return false;
  }
  delete(header, matcher) {
    const self2 = this;
    let deleted = false;
    function deleteHeader(_header) {
      _header = normalizeHeader(_header);
      if (_header) {
        const key = utils_default.findKey(self2, _header);
        if (key && (!matcher || matchHeaderValue(self2, self2[key], key, matcher))) {
          delete self2[key];
          deleted = true;
        }
      }
    }
    if (utils_default.isArray(header)) {
      header.forEach(deleteHeader);
    } else {
      deleteHeader(header);
    }
    return deleted;
  }
  clear(matcher) {
    const keys = Object.keys(this);
    let i = keys.length;
    let deleted = false;
    while (i--) {
      const key = keys[i];
      if (!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
        delete this[key];
        deleted = true;
      }
    }
    return deleted;
  }
  normalize(format) {
    const self2 = this;
    const headers = {};
    utils_default.forEach(this, (value, header) => {
      const key = utils_default.findKey(headers, header);
      if (key) {
        self2[key] = normalizeValue(value);
        delete self2[header];
        return;
      }
      const normalized = format ? formatHeader(header) : String(header).trim();
      if (normalized !== header) {
        delete self2[header];
      }
      self2[normalized] = normalizeValue(value);
      headers[normalized] = true;
    });
    return this;
  }
  concat(...targets) {
    return this.constructor.concat(this, ...targets);
  }
  toJSON(asStrings) {
    const obj = /* @__PURE__ */ Object.create(null);
    utils_default.forEach(this, (value, header) => {
      value != null && value !== false && (obj[header] = asStrings && utils_default.isArray(value) ? value.join(", ") : value);
    });
    return obj;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([header, value]) => header + ": " + value).join("\n");
  }
  getSetCookie() {
    const value = this.get("set-cookie");
    return utils_default.isArray(value) ? value : value == null || value === false ? [] : [value];
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(thing) {
    return thing instanceof this ? thing : new this(thing);
  }
  static parseParameters(value) {
    return parseParameters(value);
  }
  static concat(first, ...targets) {
    const computed = new this(first);
    targets.forEach((target) => computed.set(target));
    return computed;
  }
  static accessor(header) {
    const internals = this[$internals] = this[$internals] = {
      accessors: {}
    };
    const accessors = internals.accessors;
    const prototype2 = this.prototype;
    function defineAccessor(_header) {
      const lHeader = normalizeHeader(_header);
      if (!accessors[lHeader]) {
        buildAccessors(prototype2, _header);
        accessors[lHeader] = true;
      }
    }
    utils_default.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);
    return this;
  }
};
AxiosHeaders.accessor([
  "Content-Type",
  "Content-Length",
  "Accept",
  "Accept-Encoding",
  "User-Agent",
  "Authorization"
]);
utils_default.reduceDescriptors(AxiosHeaders.prototype, ({ value }, key) => {
  let mapped = key[0].toUpperCase() + key.slice(1);
  return {
    get: () => value,
    set(headerValue) {
      this[mapped] = headerValue;
    }
  };
});
utils_default.freezeMethods(AxiosHeaders);
var AxiosHeaders_default = AxiosHeaders;

// adapters/node_modules/axios/lib/core/AxiosError.js
var REDACTED = "[REDACTED ****]";
function hasOwnOrPrototypeToJSON(source) {
  if (utils_default.hasOwnProp(source, "toJSON")) {
    return true;
  }
  let prototype2 = Object.getPrototypeOf(source);
  while (prototype2 && prototype2 !== Object.prototype) {
    if (utils_default.hasOwnProp(prototype2, "toJSON")) {
      return true;
    }
    prototype2 = Object.getPrototypeOf(prototype2);
  }
  return false;
}
function redactConfig(config2, redactKeys) {
  const lowerKeys = new Set(redactKeys.map((k) => String(k).toLowerCase()));
  const seen = [];
  const visit = (source) => {
    if (source === null || typeof source !== "object") return source;
    if (utils_default.isBuffer(source)) return source;
    if (seen.indexOf(source) !== -1) return void 0;
    if (source instanceof AxiosHeaders_default) {
      source = source.toJSON();
    }
    seen.push(source);
    let result;
    if (utils_default.isArray(source)) {
      result = [];
      source.forEach((v, i) => {
        const reducedValue = visit(v);
        if (!utils_default.isUndefined(reducedValue)) {
          result[i] = reducedValue;
        }
      });
    } else {
      if (!utils_default.isPlainObject(source) && hasOwnOrPrototypeToJSON(source)) {
        seen.pop();
        return source;
      }
      result = /* @__PURE__ */ Object.create(null);
      for (const [key, value] of Object.entries(source)) {
        const reducedValue = lowerKeys.has(key.toLowerCase()) ? REDACTED : visit(value);
        if (!utils_default.isUndefined(reducedValue)) {
          result[key] = reducedValue;
        }
      }
    }
    seen.pop();
    return result;
  };
  return visit(config2);
}
function stringifySafely(value) {
  try {
    return String(value);
  } catch (err) {
    return "";
  }
}
function aggregateErrorMessage(error) {
  const message = error.errors.map((entry) => {
    try {
      return entry && entry.message ? stringifySafely(entry.message) : stringifySafely(entry);
    } catch (err) {
      return "";
    }
  }).filter(Boolean).join("; ");
  return message || error.name || "AggregateError";
}
var AxiosError = class _AxiosError extends Error {
  static from(error, code, config2, request, response, customProps) {
    let message = error.message;
    if (!message && utils_default.isArray(error.errors) && error.errors.length) {
      message = aggregateErrorMessage(error);
    }
    const axiosError = new _AxiosError(message, code || error.code, config2, request, response);
    Object.defineProperty(axiosError, "cause", {
      __proto__: null,
      value: error,
      writable: true,
      enumerable: false,
      configurable: true
    });
    axiosError.name = error.name;
    if (error.status != null && axiosError.status == null) {
      axiosError.status = error.status;
    }
    customProps && Object.assign(axiosError, customProps);
    return axiosError;
  }
  /**
   * Create an Error with the specified message, config, error code, request and response.
   *
   * @param {string} message The error message.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [config] The config.
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   *
   * @returns {Error} The created error.
   */
  constructor(message, code, config2, request, response) {
    super(message);
    Object.defineProperty(this, "message", {
      // Null-proto descriptor so a polluted Object.prototype.get cannot turn
      // this data descriptor into an accessor descriptor on the way in.
      __proto__: null,
      value: message,
      enumerable: true,
      writable: true,
      configurable: true
    });
    this.name = "AxiosError";
    this.isAxiosError = true;
    code && (this.code = code);
    config2 && (this.config = config2);
    request && (this.request = request);
    if (response) {
      this.response = response;
      this.status = response.status;
    }
  }
  toJSON() {
    const config2 = this.config;
    const redactKeys = config2 && utils_default.hasOwnProp(config2, "redact") ? config2.redact : void 0;
    const serializedConfig = utils_default.isArray(redactKeys) && redactKeys.length > 0 ? redactConfig(config2, redactKeys) : utils_default.toJSONObject(config2);
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: serializedConfig,
      code: this.code,
      status: this.status
    };
  }
};
AxiosError.ERR_BAD_OPTION_VALUE = "ERR_BAD_OPTION_VALUE";
AxiosError.ERR_BAD_OPTION = "ERR_BAD_OPTION";
AxiosError.ECONNABORTED = "ECONNABORTED";
AxiosError.ETIMEDOUT = "ETIMEDOUT";
AxiosError.ECONNREFUSED = "ECONNREFUSED";
AxiosError.ERR_NETWORK = "ERR_NETWORK";
AxiosError.ERR_FR_TOO_MANY_REDIRECTS = "ERR_FR_TOO_MANY_REDIRECTS";
AxiosError.ERR_DEPRECATED = "ERR_DEPRECATED";
AxiosError.ERR_BAD_RESPONSE = "ERR_BAD_RESPONSE";
AxiosError.ERR_BAD_REQUEST = "ERR_BAD_REQUEST";
AxiosError.ERR_CANCELED = "ERR_CANCELED";
AxiosError.ERR_NOT_SUPPORT = "ERR_NOT_SUPPORT";
AxiosError.ERR_INVALID_URL = "ERR_INVALID_URL";
AxiosError.ERR_FORM_DATA_DEPTH_EXCEEDED = "ERR_FORM_DATA_DEPTH_EXCEEDED";
var AxiosError_default = AxiosError;

// adapters/node_modules/axios/lib/platform/node/classes/FormData.js
init_define_MACRO();
var import_form_data = __toESM(require_form_data(), 1);
var FormData_default = import_form_data.default;

// adapters/node_modules/axios/lib/platform/node/classes/Buffer.js
init_define_MACRO();
var Buffer_default = {
  isBufferAvailable() {
    return typeof Buffer !== "undefined";
  },
  from(value) {
    return Buffer.from(value);
  }
};

// adapters/node_modules/axios/lib/helpers/toFormData.js
var DEFAULT_FORM_DATA_MAX_DEPTH = 100;
function isVisitable(thing) {
  return utils_default.isPlainObject(thing) || utils_default.isArray(thing);
}
function removeBrackets(key) {
  return utils_default.endsWith(key, "[]") ? key.slice(0, -2) : key;
}
function renderKey(path3, key, dots) {
  if (!path3) return key;
  return path3.concat(key).map(function each(token, i) {
    token = removeBrackets(token);
    return !dots && i ? "[" + token + "]" : token;
  }).join(dots ? "." : "");
}
function isFlatArray(arr) {
  return utils_default.isArray(arr) && !arr.some(isVisitable);
}
var predicates = utils_default.toFlatObject(utils_default, {}, null, function filter(prop) {
  return /^is[A-Z]/.test(prop);
});
function toFormData(obj, formData, options) {
  if (!utils_default.isObject(obj)) {
    throw new TypeError("target must be an object");
  }
  formData = formData || new (FormData_default || FormData)();
  options = utils_default.toFlatObject(
    options,
    {
      metaTokens: true,
      dots: false,
      indexes: false
    },
    false,
    function defined(option, source) {
      return !utils_default.isUndefined(source[option]);
    }
  );
  const metaTokens = options.metaTokens;
  const visitor = options.visitor || defaultVisitor;
  const dots = options.dots;
  const indexes = options.indexes;
  const _Blob = options.Blob || typeof Blob !== "undefined" && Blob;
  const maxDepth = options.maxDepth === void 0 ? DEFAULT_FORM_DATA_MAX_DEPTH : options.maxDepth;
  const useBlob = _Blob && utils_default.isSpecCompliantForm(formData);
  const stack = [];
  if (!utils_default.isFunction(visitor)) {
    throw new TypeError("visitor must be a function");
  }
  function convertValue(value) {
    if (value === null) return "";
    if (utils_default.isDate(value)) {
      return value.toISOString();
    }
    if (utils_default.isBoolean(value)) {
      return value.toString();
    }
    if (!useBlob && utils_default.isBlob(value)) {
      throw new AxiosError_default("Blob is not supported. Use a Buffer instead.");
    }
    if (utils_default.isArrayBuffer(value) || utils_default.isTypedArray(value)) {
      if (useBlob && typeof _Blob === "function") {
        return new _Blob([value]);
      }
      if (Buffer_default && Buffer_default.isBufferAvailable()) {
        return Buffer_default.from(value);
      }
      throw new AxiosError_default("Blob is not supported. Use a Buffer instead.", AxiosError_default.ERR_NOT_SUPPORT);
    }
    return value;
  }
  function throwIfMaxDepthExceeded(depth) {
    if (depth > maxDepth) {
      throw new AxiosError_default(
        "Object is too deeply nested (" + depth + " levels). Max depth: " + maxDepth,
        AxiosError_default.ERR_FORM_DATA_DEPTH_EXCEEDED
      );
    }
  }
  function stringifyWithDepthLimit(value, depth) {
    if (maxDepth === Infinity) {
      return JSON.stringify(value);
    }
    const ancestors = [];
    return JSON.stringify(value, function limitDepth(_key, currentValue) {
      if (!utils_default.isObject(currentValue)) {
        return currentValue;
      }
      while (ancestors.length && ancestors[ancestors.length - 1] !== this) {
        ancestors.pop();
      }
      ancestors.push(currentValue);
      throwIfMaxDepthExceeded(depth + ancestors.length - 1);
      return currentValue;
    });
  }
  function defaultVisitor(value, key, path3) {
    let arr = value;
    if (utils_default.isReactNative(formData) && utils_default.isReactNativeBlob(value)) {
      formData.append(renderKey(path3, key, dots), convertValue(value));
      return false;
    }
    if (value && !path3 && typeof value === "object") {
      if (utils_default.endsWith(key, "{}")) {
        key = metaTokens ? key : key.slice(0, -2);
        value = stringifyWithDepthLimit(value, 1);
      } else if (utils_default.isArray(value) && isFlatArray(value) || (utils_default.isFileList(value) || utils_default.endsWith(key, "[]")) && (arr = utils_default.toArray(value))) {
        key = removeBrackets(key);
        arr.forEach(function each(el, index) {
          !(utils_default.isUndefined(el) || el === null) && formData.append(
            // eslint-disable-next-line no-nested-ternary
            indexes === true ? renderKey([key], index, dots) : indexes === null ? key : key + "[]",
            convertValue(el)
          );
        });
        return false;
      }
    }
    if (isVisitable(value)) {
      return true;
    }
    formData.append(renderKey(path3, key, dots), convertValue(value));
    return false;
  }
  const exposedHelpers = Object.assign(predicates, {
    defaultVisitor,
    convertValue,
    isVisitable
  });
  function build(value, path3, depth = 0) {
    if (utils_default.isUndefined(value)) return;
    throwIfMaxDepthExceeded(depth);
    if (stack.indexOf(value) !== -1) {
      throw new Error("Circular reference detected in " + path3.join("."));
    }
    stack.push(value);
    utils_default.forEach(value, function each(el, key) {
      const result = !(utils_default.isUndefined(el) || el === null) && visitor.call(formData, el, utils_default.isString(key) ? key.trim() : key, path3, exposedHelpers);
      if (result === true) {
        build(el, path3 ? path3.concat(key) : [key], depth + 1);
      }
    });
    stack.pop();
  }
  if (!utils_default.isObject(obj)) {
    throw new TypeError("data must be an object");
  }
  build(obj);
  return formData;
}
var toFormData_default = toFormData;

// adapters/node_modules/axios/lib/helpers/AxiosURLSearchParams.js
function encode(str) {
  const charMap = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+"
  };
  return encodeURIComponent(str).replace(/[!'()~]|%20/g, function replacer(match) {
    return charMap[match];
  });
}
function AxiosURLSearchParams(params, options) {
  this._pairs = [];
  params && toFormData_default(params, this, options);
}
var prototype = AxiosURLSearchParams.prototype;
prototype.append = function append(name, value) {
  this._pairs.push([name, value]);
};
prototype.toString = function toString2(encoder) {
  const _encode = encoder ? (value) => encoder.call(this, value, encode) : encode;
  return this._pairs.map(function each(pair) {
    return _encode(pair[0]) + "=" + _encode(pair[1]);
  }, "").join("&");
};
var AxiosURLSearchParams_default = AxiosURLSearchParams;

// adapters/node_modules/axios/lib/helpers/buildURL.js
function encode2(val) {
  return encodeURIComponent(val).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+");
}
function buildURL(url2, params, options) {
  if (!params) {
    return url2;
  }
  url2 = url2 || "";
  const _options = utils_default.isFunction(options) ? {
    serialize: options
  } : options;
  const _encode = utils_default.getSafeProp(_options, "encode") || encode2;
  const serializeFn = utils_default.getSafeProp(_options, "serialize");
  let serializedParams;
  if (serializeFn) {
    serializedParams = serializeFn(params, _options);
  } else {
    serializedParams = utils_default.isURLSearchParams(params) ? params.toString() : new AxiosURLSearchParams_default(params, _options).toString(_encode);
  }
  if (serializedParams) {
    const hashmarkIndex = url2.indexOf("#");
    if (hashmarkIndex !== -1) {
      url2 = url2.slice(0, hashmarkIndex);
    }
    url2 += (url2.indexOf("?") === -1 ? "?" : "&") + serializedParams;
  }
  return url2;
}

// adapters/node_modules/axios/lib/core/InterceptorManager.js
init_define_MACRO();
var InterceptorManager = class {
  constructor() {
    this.handlers = [];
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   * @param {Object} options The options for the interceptor, synchronous and runWhen
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(fulfilled, rejected, options) {
    this.handlers.push({
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null
    });
    return this.handlers.length - 1;
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {void}
   */
  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
    }
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn) {
    utils_default.forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  }
};
var InterceptorManager_default = InterceptorManager;

// adapters/node_modules/axios/lib/core/dispatchRequest.js
init_define_MACRO();

// adapters/node_modules/axios/lib/core/transformData.js
init_define_MACRO();

// adapters/node_modules/axios/lib/defaults/index.js
init_define_MACRO();

// adapters/node_modules/axios/lib/defaults/transitional.js
init_define_MACRO();
var transitional_default = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false,
  legacyInterceptorReqResOrdering: true,
  advertiseZstdAcceptEncoding: false,
  validateStatusUndefinedResolves: true
};

// adapters/node_modules/axios/lib/helpers/toURLEncodedForm.js
init_define_MACRO();

// adapters/node_modules/axios/lib/platform/index.js
init_define_MACRO();

// adapters/node_modules/axios/lib/platform/node/index.js
init_define_MACRO();
import crypto from "crypto";

// adapters/node_modules/axios/lib/platform/node/classes/URLSearchParams.js
init_define_MACRO();
import url from "url";
var URLSearchParams_default = url.URLSearchParams;

// adapters/node_modules/axios/lib/platform/node/index.js
var ALPHA = "abcdefghijklmnopqrstuvwxyz";
var DIGIT = "0123456789";
var ALPHABET = {
  DIGIT,
  ALPHA,
  ALPHA_DIGIT: ALPHA + ALPHA.toUpperCase() + DIGIT
};
var generateString = (size = 16, alphabet = ALPHABET.ALPHA_DIGIT) => {
  let str = "";
  const { length } = alphabet;
  const randomValues = new Uint32Array(size);
  crypto.randomFillSync(randomValues);
  for (let i = 0; i < size; i++) {
    str += alphabet[randomValues[i] % length];
  }
  return str;
};
var node_default = {
  isNode: true,
  classes: {
    URLSearchParams: URLSearchParams_default,
    FormData: FormData_default,
    Blob: typeof Blob !== "undefined" && Blob || null
  },
  ALPHABET,
  generateString,
  protocols: ["http", "https", "file", "data"]
};

// adapters/node_modules/axios/lib/platform/common/utils.js
var utils_exports = {};
__export(utils_exports, {
  hasBrowserEnv: () => hasBrowserEnv,
  hasStandardBrowserEnv: () => hasStandardBrowserEnv,
  hasStandardBrowserWebWorkerEnv: () => hasStandardBrowserWebWorkerEnv,
  navigator: () => _navigator,
  origin: () => origin
});
init_define_MACRO();
var hasBrowserEnv = typeof window !== "undefined" && typeof document !== "undefined";
var _navigator = typeof navigator === "object" && navigator || void 0;
var hasStandardBrowserEnv = hasBrowserEnv && (!_navigator || ["ReactNative", "NativeScript", "NS"].indexOf(_navigator.product) < 0);
var hasStandardBrowserWebWorkerEnv = (() => {
  return typeof WorkerGlobalScope !== "undefined" && // eslint-disable-next-line no-undef
  self instanceof WorkerGlobalScope && typeof self.importScripts === "function";
})();
var origin = hasBrowserEnv && window.location.href || "http://localhost";

// adapters/node_modules/axios/lib/platform/index.js
var platform_default = {
  ...utils_exports,
  ...node_default
};

// adapters/node_modules/axios/lib/helpers/toURLEncodedForm.js
function toURLEncodedForm(data, options) {
  return toFormData_default(data, new platform_default.classes.URLSearchParams(), {
    visitor: function(value, key, path3, helpers) {
      if (platform_default.isNode && utils_default.isBuffer(value)) {
        this.append(key, value.toString("base64"));
        return false;
      }
      return helpers.defaultVisitor.apply(this, arguments);
    },
    ...options
  });
}

// adapters/node_modules/axios/lib/helpers/formDataToJSON.js
init_define_MACRO();
var MAX_DEPTH = DEFAULT_FORM_DATA_MAX_DEPTH;
function throwIfDepthExceeded(index) {
  if (index > MAX_DEPTH) {
    throw new AxiosError_default(
      "FormData field is too deeply nested (" + index + " levels). Max depth: " + MAX_DEPTH,
      AxiosError_default.ERR_FORM_DATA_DEPTH_EXCEEDED
    );
  }
}
function parsePropPath(name) {
  const path3 = [];
  const pattern = /[^.[\]]+|\[([^.[\]]*)]/g;
  let match;
  while ((match = pattern.exec(name)) !== null) {
    throwIfDepthExceeded(path3.length);
    path3.push(match[0] === "[]" ? "" : match[1] || match[0]);
  }
  return path3;
}
function arrayToObject(arr) {
  const obj = {};
  const keys = Object.keys(arr);
  let i;
  const len = keys.length;
  let key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    obj[key] = arr[key];
  }
  return obj;
}
function formDataToJSON(formData) {
  function buildPath(path3, value, target, index) {
    throwIfDepthExceeded(index);
    let name = path3[index++];
    if (name === "__proto__") return true;
    const isNumericKey = Number.isFinite(+name);
    const isLast = index >= path3.length;
    name = !name && utils_default.isArray(target) ? target.length : name;
    if (isLast) {
      if (utils_default.hasOwnProp(target, name)) {
        target[name] = utils_default.isArray(target[name]) ? target[name].concat(value) : [target[name], value];
      } else {
        target[name] = value;
      }
      return !isNumericKey;
    }
    if (!utils_default.hasOwnProp(target, name) || !utils_default.isObject(target[name])) {
      target[name] = [];
    }
    const result = buildPath(path3, value, target[name], index);
    if (result && utils_default.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }
    return !isNumericKey;
  }
  if (utils_default.isFormData(formData) && utils_default.isFunction(formData.entries)) {
    const obj = {};
    utils_default.forEachEntry(formData, (name, value) => {
      buildPath(parsePropPath(name), value, obj, 0);
    });
    return obj;
  }
  return null;
}
var formDataToJSON_default = formDataToJSON;

// adapters/node_modules/axios/lib/defaults/index.js
var own = (obj, key) => obj != null && utils_default.hasOwnProp(obj, key) ? obj[key] : void 0;
function stringifySafely2(rawValue, parser, encoder) {
  if (utils_default.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils_default.trim(rawValue);
    } catch (e) {
      if (e.name !== "SyntaxError") {
        throw e;
      }
    }
  }
  return (encoder || JSON.stringify)(rawValue);
}
var defaults = {
  transitional: transitional_default,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [
    function transformRequest(data, headers) {
      const contentType = headers.getContentType() || "";
      const hasJSONContentType = contentType.indexOf("application/json") > -1;
      const isObjectPayload = utils_default.isObject(data);
      if (isObjectPayload && utils_default.isHTMLForm(data)) {
        data = new FormData(data);
      }
      const isFormData2 = utils_default.isFormData(data);
      if (isFormData2) {
        return hasJSONContentType ? JSON.stringify(formDataToJSON_default(data)) : data;
      }
      if (utils_default.isArrayBuffer(data) || utils_default.isBuffer(data) || utils_default.isStream(data) || utils_default.isFile(data) || utils_default.isBlob(data) || utils_default.isReadableStream(data)) {
        return data;
      }
      if (utils_default.isArrayBufferView(data)) {
        return data.buffer;
      }
      if (utils_default.isURLSearchParams(data)) {
        headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
        return data.toString();
      }
      let isFileList2;
      if (isObjectPayload) {
        const formSerializer = own(this, "formSerializer");
        if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
          return toURLEncodedForm(data, formSerializer).toString();
        }
        if ((isFileList2 = utils_default.isFileList(data)) || contentType.indexOf("multipart/form-data") > -1) {
          const env = own(this, "env");
          const _FormData = env && env.FormData;
          return toFormData_default(
            isFileList2 ? { "files[]": data } : data,
            _FormData && new _FormData(),
            formSerializer
          );
        }
      }
      if (isObjectPayload || hasJSONContentType) {
        headers.setContentType("application/json", false);
        return stringifySafely2(data);
      }
      return data;
    }
  ],
  transformResponse: [
    function transformResponse(data) {
      const transitional2 = own(this, "transitional") || defaults.transitional;
      const forcedJSONParsing = transitional2 && transitional2.forcedJSONParsing;
      const responseType = own(this, "responseType");
      const JSONRequested = responseType === "json";
      if (utils_default.isResponse(data) || utils_default.isReadableStream(data)) {
        return data;
      }
      if (data && utils_default.isString(data) && (forcedJSONParsing && !responseType || JSONRequested)) {
        const silentJSONParsing = transitional2 && transitional2.silentJSONParsing;
        const strictJSONParsing = !silentJSONParsing && JSONRequested;
        try {
          return JSON.parse(data, own(this, "parseReviver"));
        } catch (e) {
          if (strictJSONParsing) {
            if (e.name === "SyntaxError") {
              throw AxiosError_default.from(e, AxiosError_default.ERR_BAD_RESPONSE, this, null, own(this, "response"));
            }
            throw e;
          }
        }
      }
      return data;
    }
  ],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: platform_default.classes.FormData,
    Blob: platform_default.classes.Blob
  },
  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },
  headers: {
    common: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": void 0
    }
  }
};
utils_default.forEach(["delete", "get", "head", "post", "put", "patch", "query"], (method) => {
  defaults.headers[method] = {};
});
var defaults_default = defaults;

// adapters/node_modules/axios/lib/core/transformData.js
function transformData(fns, response) {
  const config2 = this || defaults_default;
  const context = response || config2;
  const headers = AxiosHeaders_default.from(context.headers);
  let data = context.data;
  utils_default.forEach(fns, function transform(fn) {
    data = fn.call(config2, data, headers.normalize(), response ? response.status : void 0);
  });
  headers.normalize();
  return data;
}

// adapters/node_modules/axios/lib/cancel/isCancel.js
init_define_MACRO();
function isCancel(value) {
  return !!(value && value.__CANCEL__);
}

// adapters/node_modules/axios/lib/cancel/CanceledError.js
init_define_MACRO();
var CanceledError = class extends AxiosError_default {
  /**
   * A `CanceledError` is an object that is thrown when an operation is canceled.
   *
   * @param {string=} message The message.
   * @param {Object=} config The config.
   * @param {Object=} request The request.
   *
   * @returns {CanceledError} The created error.
   */
  constructor(message, config2, request) {
    super(message == null ? "canceled" : message, AxiosError_default.ERR_CANCELED, config2, request);
    this.name = "CanceledError";
    this.__CANCEL__ = true;
  }
};
var CanceledError_default = CanceledError;

// adapters/node_modules/axios/lib/adapters/adapters.js
init_define_MACRO();

// adapters/node_modules/axios/lib/adapters/http.js
init_define_MACRO();

// adapters/node_modules/axios/lib/core/settle.js
init_define_MACRO();
function settle(resolve, reject, response) {
  const validateStatus2 = response.config.validateStatus;
  if (!response.status || !validateStatus2 || validateStatus2(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError_default(
      "Request failed with status code " + response.status,
      response.status >= 400 && response.status < 500 ? AxiosError_default.ERR_BAD_REQUEST : AxiosError_default.ERR_BAD_RESPONSE,
      response.config,
      response.request,
      response
    ));
  }
}

// adapters/node_modules/axios/lib/core/buildFullPath.js
init_define_MACRO();

// adapters/node_modules/axios/lib/helpers/isAbsoluteURL.js
init_define_MACRO();
function isAbsoluteURL(url2) {
  if (typeof url2 !== "string") {
    return false;
  }
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url2);
}

// adapters/node_modules/axios/lib/helpers/combineURLs.js
init_define_MACRO();
function combineURLs(baseURL, relativeURL) {
  if (!relativeURL) {
    return baseURL;
  }
  let end = baseURL.length;
  while (end > 0 && baseURL.charCodeAt(end - 1) === 47) {
    end--;
  }
  return baseURL.slice(0, end) + "/" + relativeURL.replace(/^\/+/, "");
}

// adapters/node_modules/axios/lib/core/buildFullPath.js
var malformedHttpProtocol = /^https?:(?!\/\/)/i;
var httpProtocolControlCharacters = /[\t\n\r]/g;
function stripLeadingC0ControlOrSpace(url2) {
  let i = 0;
  while (i < url2.length && url2.charCodeAt(i) <= 32) {
    i++;
  }
  return url2.slice(i);
}
function normalizeURLForProtocolCheck(url2) {
  return stripLeadingC0ControlOrSpace(url2).replace(httpProtocolControlCharacters, "");
}
function redactFragment(fragment) {
  if (!fragment) {
    return fragment;
  }
  return fragment.replace(/(^|&)([^=&]*=)?[^&]+/g, (match, separator, parameterName = "") => {
    return `${separator}${parameterName}${REDACTED}`;
  });
}
function redactSensitiveURLParts(url2) {
  const redactedURL = url2.replace(/^(https?:\/{0,2})[^/?#]*@/i, `$1${REDACTED}@`);
  const fragmentIndex = redactedURL.indexOf("#");
  const urlWithoutFragment = fragmentIndex === -1 ? redactedURL : redactedURL.slice(0, fragmentIndex);
  const redactedURLWithoutFragment = urlWithoutFragment.replace(
    /([?&][^=&#]*=)[^&#]*/g,
    `$1${REDACTED}`
  );
  if (fragmentIndex === -1) {
    return redactedURLWithoutFragment;
  }
  return `${redactedURLWithoutFragment}#${redactFragment(redactedURL.slice(fragmentIndex + 1))}`;
}
function assertValidHttpProtocolURL(url2, config2) {
  if (typeof url2 === "string") {
    const normalizedURL = normalizeURLForProtocolCheck(url2);
    if (malformedHttpProtocol.test(normalizedURL)) {
      throw new AxiosError_default(
        `Invalid URL ${JSON.stringify(redactSensitiveURLParts(normalizedURL))}: missing "//" after protocol`,
        AxiosError_default.ERR_INVALID_URL,
        config2
      );
    }
  }
}
function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls, config2) {
  assertValidHttpProtocolURL(requestedURL, config2);
  let isRelativeUrl = !isAbsoluteURL(requestedURL);
  if (baseURL && (isRelativeUrl || allowAbsoluteUrls === false)) {
    assertValidHttpProtocolURL(baseURL, config2);
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}

// adapters/node_modules/proxy-from-env/index.js
init_define_MACRO();
var DEFAULT_PORTS = {
  ftp: 21,
  gopher: 70,
  http: 80,
  https: 443,
  ws: 80,
  wss: 443
};
function parseUrl(urlString) {
  try {
    return new URL(urlString);
  } catch {
    return null;
  }
}
function getProxyForUrl(url2) {
  var parsedUrl = (typeof url2 === "string" ? parseUrl(url2) : url2) || {};
  var proto = parsedUrl.protocol;
  var hostname = parsedUrl.host;
  var port = parsedUrl.port;
  if (typeof hostname !== "string" || !hostname || typeof proto !== "string") {
    return "";
  }
  proto = proto.split(":", 1)[0];
  hostname = hostname.replace(/:\d*$/, "");
  port = parseInt(port) || DEFAULT_PORTS[proto] || 0;
  if (!shouldProxy(hostname, port)) {
    return "";
  }
  var proxy = getEnv(proto + "_proxy") || getEnv("all_proxy");
  if (proxy && proxy.indexOf("://") === -1) {
    proxy = proto + "://" + proxy;
  }
  return proxy;
}
function shouldProxy(hostname, port) {
  var NO_PROXY = getEnv("no_proxy").toLowerCase();
  if (!NO_PROXY) {
    return true;
  }
  if (NO_PROXY === "*") {
    return false;
  }
  return NO_PROXY.split(/[,\s]/).every(function(proxy) {
    if (!proxy) {
      return true;
    }
    var parsedProxy = proxy.match(/^(.+):(\d+)$/);
    var parsedProxyHostname = parsedProxy ? parsedProxy[1] : proxy;
    var parsedProxyPort = parsedProxy ? parseInt(parsedProxy[2]) : 0;
    if (parsedProxyPort && parsedProxyPort !== port) {
      return true;
    }
    if (!/^[.*]/.test(parsedProxyHostname)) {
      return hostname !== parsedProxyHostname;
    }
    if (parsedProxyHostname.charAt(0) === "*") {
      parsedProxyHostname = parsedProxyHostname.slice(1);
    }
    return !hostname.endsWith(parsedProxyHostname);
  });
}
function getEnv(key) {
  return process.env[key.toLowerCase()] || process.env[key.toUpperCase()] || "";
}

// adapters/node_modules/axios/lib/adapters/http.js
var import_https_proxy_agent = __toESM(require_dist(), 1);
var import_follow_redirects = __toESM(require_follow_redirects(), 1);
import http from "http";
import https from "https";
import http22 from "http2";
import util3 from "util";
import { resolve as resolvePath } from "path";
import zlib from "zlib";

// adapters/node_modules/axios/lib/env/data.js
init_define_MACRO();
var VERSION = "1.19.0";

// adapters/node_modules/axios/lib/helpers/fromDataURI.js
init_define_MACRO();

// adapters/node_modules/axios/lib/helpers/parseProtocol.js
init_define_MACRO();
function parseProtocol(url2) {
  const match = /^([-+\w]{1,25}):(?:\/\/)?/.exec(url2);
  return match && match[1] || "";
}

// adapters/node_modules/axios/lib/helpers/fromDataURI.js
var DATA_URL_PATTERN = /^([^,;]+\/[^,;]+)?((?:;[^,;=]+=[^,;]+)*)(;base64)?,([\s\S]*)$/;
function fromDataURI(uri, asBlob, options) {
  const _Blob = options && options.Blob || platform_default.classes.Blob;
  const protocol = parseProtocol(uri);
  if (asBlob === void 0 && _Blob) {
    asBlob = true;
  }
  if (protocol === "data") {
    uri = protocol.length ? uri.slice(protocol.length + 1) : uri;
    const match = DATA_URL_PATTERN.exec(uri);
    if (!match) {
      throw new AxiosError_default("Invalid URL", AxiosError_default.ERR_INVALID_URL);
    }
    const type = match[1];
    const params = match[2];
    const encoding = match[3] ? "base64" : "utf8";
    const body = match[4];
    let mime = "";
    if (type) {
      mime = params ? type + params : type;
    } else if (params) {
      mime = "text/plain" + params;
    }
    const buffer = encoding === "base64" ? Buffer.from(body, "base64") : Buffer.from(decodeURIComponent(body), encoding);
    if (asBlob) {
      if (!_Blob) {
        throw new AxiosError_default("Blob is not supported", AxiosError_default.ERR_NOT_SUPPORT);
      }
      return new _Blob([buffer], { type: mime });
    }
    return buffer;
  }
  throw new AxiosError_default("Unsupported protocol " + protocol, AxiosError_default.ERR_NOT_SUPPORT);
}

// adapters/node_modules/axios/lib/adapters/http.js
import stream3 from "stream";

// adapters/node_modules/axios/lib/core/setFormDataHeaders.js
init_define_MACRO();
var FORM_DATA_CONTENT_HEADERS = ["content-type", "content-length"];
function setFormDataHeaders(headers, formHeaders, policy) {
  if (policy !== "content-only") {
    headers.set(formHeaders);
    return;
  }
  Object.entries(formHeaders || {}).forEach(([key, val]) => {
    if (FORM_DATA_CONTENT_HEADERS.includes(key.toLowerCase())) {
      headers.set(key, val);
    }
  });
}

// adapters/node_modules/axios/lib/helpers/AxiosTransformStream.js
init_define_MACRO();
import stream from "stream";
var kInternals = /* @__PURE__ */ Symbol("internals");
var AxiosTransformStream = class extends stream.Transform {
  constructor(options) {
    options = utils_default.toFlatObject(
      options,
      {
        maxRate: 0,
        chunkSize: 64 * 1024,
        minChunkSize: 100,
        timeWindow: 500,
        ticksRate: 2,
        samplesCount: 15
      },
      null,
      (prop, source) => {
        return !utils_default.isUndefined(source[prop]);
      }
    );
    super({
      readableHighWaterMark: options.chunkSize
    });
    const internals = this[kInternals] = {
      timeWindow: options.timeWindow,
      chunkSize: options.chunkSize,
      maxRate: options.maxRate,
      minChunkSize: options.minChunkSize,
      bytesSeen: 0,
      isCaptured: false,
      notifiedBytesLoaded: 0,
      ts: Date.now(),
      bytes: 0,
      onReadCallback: null
    };
    this.on("newListener", (event) => {
      if (event === "progress") {
        if (!internals.isCaptured) {
          internals.isCaptured = true;
        }
      }
    });
  }
  _read(size) {
    const internals = this[kInternals];
    if (internals.onReadCallback) {
      internals.onReadCallback();
    }
    return super._read(size);
  }
  _transform(chunk, encoding, callback) {
    const internals = this[kInternals];
    const maxRate = internals.maxRate;
    const readableHighWaterMark = this.readableHighWaterMark;
    const timeWindow = internals.timeWindow;
    const divider = 1e3 / timeWindow;
    const bytesThreshold = maxRate / divider;
    const minChunkSize = internals.minChunkSize !== false ? Math.max(internals.minChunkSize, bytesThreshold * 0.01) : 0;
    const pushChunk = (_chunk, _callback) => {
      const bytes = Buffer.byteLength(_chunk);
      internals.bytesSeen += bytes;
      internals.bytes += bytes;
      internals.isCaptured && this.emit("progress", internals.bytesSeen);
      if (this.push(_chunk)) {
        process.nextTick(_callback);
      } else {
        internals.onReadCallback = () => {
          internals.onReadCallback = null;
          process.nextTick(_callback);
        };
      }
    };
    const transformChunk = (_chunk, _callback) => {
      const chunkSize = Buffer.byteLength(_chunk);
      let chunkRemainder = null;
      let maxChunkSize = readableHighWaterMark;
      let bytesLeft;
      let passed = 0;
      if (maxRate) {
        const now = Date.now();
        if (!internals.ts || (passed = now - internals.ts) >= timeWindow) {
          internals.ts = now;
          bytesLeft = bytesThreshold - internals.bytes;
          internals.bytes = bytesLeft < 0 ? -bytesLeft : 0;
          passed = 0;
        }
        bytesLeft = bytesThreshold - internals.bytes;
      }
      if (maxRate) {
        if (bytesLeft <= 0) {
          return setTimeout(() => {
            _callback(null, _chunk);
          }, timeWindow - passed);
        }
        if (bytesLeft < maxChunkSize) {
          maxChunkSize = bytesLeft;
        }
      }
      if (maxChunkSize && chunkSize > maxChunkSize && chunkSize - maxChunkSize > minChunkSize) {
        chunkRemainder = _chunk.subarray(maxChunkSize);
        _chunk = _chunk.subarray(0, maxChunkSize);
      }
      pushChunk(
        _chunk,
        chunkRemainder ? () => {
          process.nextTick(_callback, null, chunkRemainder);
        } : _callback
      );
    };
    transformChunk(chunk, function transformNextChunk(err, _chunk) {
      if (err) {
        return callback(err);
      }
      if (_chunk) {
        transformChunk(_chunk, transformNextChunk);
      } else {
        callback(null);
      }
    });
  }
};
var AxiosTransformStream_default = AxiosTransformStream;

// adapters/node_modules/axios/lib/adapters/http.js
import { EventEmitter } from "events";

// adapters/node_modules/axios/lib/helpers/formDataToStream.js
init_define_MACRO();
import util from "util";
import { Readable } from "stream";

// adapters/node_modules/axios/lib/helpers/readBlob.js
init_define_MACRO();
var { asyncIterator } = Symbol;
var readBlob = async function* (blob) {
  if (blob.stream) {
    yield* blob.stream();
  } else if (blob.arrayBuffer) {
    yield await blob.arrayBuffer();
  } else if (blob[asyncIterator]) {
    yield* blob[asyncIterator]();
  } else {
    yield blob;
  }
};
var readBlob_default = readBlob;

// adapters/node_modules/axios/lib/helpers/formDataToStream.js
var BOUNDARY_ALPHABET = platform_default.ALPHABET.ALPHA_DIGIT + "-_";
var textEncoder = typeof TextEncoder === "function" ? new TextEncoder() : new util.TextEncoder();
var CRLF = "\r\n";
var CRLF_BYTES = textEncoder.encode(CRLF);
var CRLF_BYTES_COUNT = 2;
var FormDataPart = class {
  constructor(name, value) {
    const { escapeName } = this.constructor;
    const isStringValue = utils_default.isString(value);
    let headers = `Content-Disposition: form-data; name="${escapeName(name)}"${!isStringValue && value.name ? `; filename="${escapeName(value.name)}"` : ""}${CRLF}`;
    if (isStringValue) {
      value = textEncoder.encode(String(value).replace(/\r?\n|\r\n?/g, CRLF));
    } else {
      const safeType = String(value.type || "application/octet-stream").replace(/[\r\n]/g, "");
      headers += `Content-Type: ${safeType}${CRLF}`;
    }
    this.headers = textEncoder.encode(headers + CRLF);
    this.contentLength = isStringValue ? value.byteLength : value.size;
    this.size = this.headers.byteLength + this.contentLength + CRLF_BYTES_COUNT;
    this.name = name;
    this.value = value;
  }
  async *encode() {
    yield this.headers;
    const { value } = this;
    if (utils_default.isTypedArray(value)) {
      yield value;
    } else {
      yield* readBlob_default(value);
    }
    yield CRLF_BYTES;
  }
  static escapeName(name) {
    return String(name).replace(
      /[\r\n"]/g,
      (match) => ({
        "\r": "%0D",
        "\n": "%0A",
        '"': "%22"
      })[match]
    );
  }
};
var formDataToStream = (form, headersHandler, options) => {
  const {
    tag = "form-data-boundary",
    size = 25,
    boundary = tag + "-" + platform_default.generateString(size, BOUNDARY_ALPHABET)
  } = options || {};
  if (!utils_default.isFormData(form)) {
    throw new TypeError("FormData instance required");
  }
  if (boundary.length < 1 || boundary.length > 70) {
    throw new Error("boundary must be 1-70 characters long");
  }
  const boundaryBytes = textEncoder.encode("--" + boundary + CRLF);
  const footerBytes = textEncoder.encode("--" + boundary + "--" + CRLF);
  let contentLength = footerBytes.byteLength;
  const parts = Array.from(form.entries()).map(([name, value]) => {
    const part = new FormDataPart(name, value);
    contentLength += part.size;
    return part;
  });
  contentLength += boundaryBytes.byteLength * parts.length;
  contentLength = utils_default.toFiniteNumber(contentLength);
  const computedHeaders = {
    "Content-Type": `multipart/form-data; boundary=${boundary}`
  };
  if (Number.isFinite(contentLength)) {
    computedHeaders["Content-Length"] = contentLength;
  }
  headersHandler && headersHandler(computedHeaders);
  return Readable.from(
    (async function* () {
      for (const part of parts) {
        yield boundaryBytes;
        yield* part.encode();
      }
      yield footerBytes;
    })()
  );
};
var formDataToStream_default = formDataToStream;

// adapters/node_modules/axios/lib/helpers/ZlibHeaderTransformStream.js
init_define_MACRO();
import stream2 from "stream";
var ZlibHeaderTransformStream = class extends stream2.Transform {
  __transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  }
  _transform(chunk, encoding, callback) {
    if (chunk.length !== 0) {
      this._transform = this.__transform;
      if (chunk[0] !== 120) {
        const header = Buffer.alloc(2);
        header[0] = 120;
        header[1] = 156;
        this.push(header, encoding);
      }
    }
    this.__transform(chunk, encoding, callback);
  }
};
var ZlibHeaderTransformStream_default = ZlibHeaderTransformStream;

// adapters/node_modules/axios/lib/helpers/Http2Sessions.js
init_define_MACRO();
import http2 from "http2";
import util2 from "util";
var Http2Sessions = class {
  constructor() {
    this.sessions = /* @__PURE__ */ Object.create(null);
  }
  getSession(authority, options) {
    options = Object.assign(
      {
        sessionTimeout: 1e3
      },
      options
    );
    let authoritySessions = this.sessions[authority];
    if (authoritySessions) {
      let len = authoritySessions.length;
      for (let i = 0; i < len; i++) {
        const [sessionHandle, sessionOptions] = authoritySessions[i];
        if (!sessionHandle.destroyed && !sessionHandle.closed && util2.isDeepStrictEqual(sessionOptions, options)) {
          return sessionHandle;
        }
      }
    }
    const session = http2.connect(authority, options);
    let removed;
    let timer;
    const removeSession = () => {
      if (removed) {
        return;
      }
      removed = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      let entries = authoritySessions, len = entries.length, i = len;
      while (i--) {
        if (entries[i][0] === session) {
          if (len === 1) {
            delete this.sessions[authority];
          } else {
            entries.splice(i, 1);
          }
          if (!session.closed) {
            session.close();
          }
          return;
        }
      }
    };
    const originalRequestFn = session.request;
    const { sessionTimeout } = options;
    if (sessionTimeout != null) {
      let streamsCount = 0;
      session.request = function() {
        const stream4 = originalRequestFn.apply(this, arguments);
        streamsCount++;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        stream4.once("close", () => {
          if (!--streamsCount) {
            timer = setTimeout(() => {
              timer = null;
              removeSession();
            }, sessionTimeout);
          }
        });
        return stream4;
      };
    }
    session.once("close", removeSession);
    let entry = [session, options];
    authoritySessions ? authoritySessions.push(entry) : authoritySessions = this.sessions[authority] = [entry];
    return session;
  }
};
var Http2Sessions_default = Http2Sessions;

// adapters/node_modules/axios/lib/helpers/callbackify.js
init_define_MACRO();
var callbackify = (fn, reducer) => {
  return utils_default.isAsyncFn(fn) ? function(...args) {
    const cb = args.pop();
    fn.apply(this, args).then((value) => {
      try {
        reducer ? cb(null, ...reducer(value)) : cb(null, value);
      } catch (err) {
        cb(err);
      }
    }, cb);
  } : fn;
};
var callbackify_default = callbackify;

// adapters/node_modules/axios/lib/helpers/shouldBypassProxy.js
init_define_MACRO();
var LOOPBACK_HOSTNAMES = /* @__PURE__ */ new Set(["localhost", "0.0.0.0"]);
var isIPv4Loopback = (host) => {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  if (parts[0] !== "127") return false;
  return parts.every((p) => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
};
var parseIPv4Octet = (text) => {
  if (/^0[xX][0-9a-fA-F]+$/.test(text)) {
    const n = parseInt(text.slice(2), 16);
    return Number.isFinite(n) ? n : null;
  }
  if (text.length > 1 && /^0[0-7]+$/.test(text)) {
    const n = parseInt(text, 8);
    return Number.isFinite(n) ? n : null;
  }
  if (text.length > 1 && /^0[0-9]+$/.test(text)) {
    return null;
  }
  if (/^[0-9]+$/.test(text)) {
    const n = parseInt(text, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};
var normalizeIPAddress = (host) => {
  if (typeof host !== "string" || !host || host.indexOf(":") !== -1) {
    return host;
  }
  let h = host;
  if (h.charAt(0) === "[" && h.charAt(h.length - 1) === "]") {
    h = h.slice(1, -1);
  }
  h = h.replace(/\.+$/, "");
  if (!/^[0-9.xXa-fA-F]+$/.test(h)) return host;
  const parts = h.split(".");
  if (parts.some((p) => p === "")) return host;
  if (parts.length === 4) {
    const octets = parts.map(parseIPv4Octet);
    if (octets.some((n) => n === null || n < 0 || n > 255)) return host;
    return octets.join(".");
  }
  if (parts.length > 4) {
    return host;
  }
  if (parts.length === 1) return host;
  const literalOctets = parts.slice(0, -1);
  const tail = parts[parts.length - 1];
  const tailSlots = 4 - literalOctets.length;
  const tailValue = parseIPv4Octet(tail);
  if (tailValue === null) return host;
  const maxTail = (1 << 8 * tailSlots) - 1;
  if (tailValue < 0 || tailValue > maxTail) return host;
  const tailOctets = new Array(tailSlots).fill(0);
  for (let i = tailSlots - 1, v = tailValue; i >= 0; i--, v >>= 8) {
    tailOctets[i] = v & 255;
  }
  const literal = literalOctets.map(parseIPv4Octet);
  if (literal.some((n) => n === null || n < 0 || n > 255)) return host;
  return [...literal, ...tailOctets].join(".");
};
var isIPv6ZeroGroup = (group) => /^0{1,4}$/.test(group);
var isIPv6Unspecified = (host) => {
  if (host === "::") return true;
  const compressionIndex = host.indexOf("::");
  if (compressionIndex !== -1) {
    if (compressionIndex !== host.lastIndexOf("::")) return false;
    const left = host.slice(0, compressionIndex);
    const right = host.slice(compressionIndex + 2);
    const leftGroups = left ? left.split(":") : [];
    const rightGroups = right ? right.split(":") : [];
    const explicitGroups = leftGroups.length + rightGroups.length;
    return explicitGroups < 8 && leftGroups.every(isIPv6ZeroGroup) && rightGroups.every(isIPv6ZeroGroup);
  }
  const groups = host.split(":");
  return groups.length === 8 && groups.every(isIPv6ZeroGroup);
};
var isIPv6Loopback = (host) => {
  if (host === "::1") return true;
  const v4MappedDotted = host.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4MappedDotted) return isIPv4Loopback(v4MappedDotted[1]);
  const v4MappedHex = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (v4MappedHex) {
    const high = parseInt(v4MappedHex[1], 16);
    return high >= 32512 && high <= 32767;
  }
  const groups = host.split(":");
  if (groups.length === 8) {
    for (let i = 0; i < 7; i++) {
      if (!/^0+$/.test(groups[i])) return false;
    }
    return /^0*1$/.test(groups[7]);
  }
  return false;
};
var isLoopback = (host) => {
  if (!host) return false;
  if (LOOPBACK_HOSTNAMES.has(host)) return true;
  if (isIPv4Loopback(host)) return true;
  if (isIPv6Unspecified(host)) return true;
  return isIPv6Loopback(host);
};
var DEFAULT_PORTS2 = {
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
  ftp: 21
};
var parseNoProxyEntry = (entry) => {
  let entryHost = entry;
  let entryPort = 0;
  if (entryHost.charAt(0) === "[") {
    const bracketIndex = entryHost.indexOf("]");
    if (bracketIndex !== -1) {
      const host = entryHost.slice(1, bracketIndex);
      const rest = entryHost.slice(bracketIndex + 1);
      if (rest.charAt(0) === ":" && /^\d+$/.test(rest.slice(1))) {
        entryPort = Number.parseInt(rest.slice(1), 10);
      }
      return [host, entryPort];
    }
  }
  const firstColon = entryHost.indexOf(":");
  const lastColon = entryHost.lastIndexOf(":");
  if (firstColon !== -1 && firstColon === lastColon && /^\d+$/.test(entryHost.slice(lastColon + 1))) {
    entryPort = Number.parseInt(entryHost.slice(lastColon + 1), 10);
    entryHost = entryHost.slice(0, lastColon);
  }
  return [entryHost, entryPort];
};
var IPV4_MAPPED_DOTTED_RE = /^(?:::|(?:0{1,4}:){1,4}:|(?:0{1,4}:){5})ffff:(\d+\.\d+\.\d+\.\d+)$/i;
var IPV4_MAPPED_HEX_RE = /^(?:::|(?:0{1,4}:){1,4}:|(?:0{1,4}:){5})ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i;
var unmapIPv4MappedIPv6 = (host) => {
  if (typeof host !== "string" || host.indexOf(":") === -1) return host;
  const dotted = host.match(IPV4_MAPPED_DOTTED_RE);
  if (dotted) return dotted[1];
  const hex = host.match(IPV4_MAPPED_HEX_RE);
  if (hex) {
    const high = parseInt(hex[1], 16);
    const low = parseInt(hex[2], 16);
    return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
  }
  return host;
};
var normalizeNoProxyHost = (hostname) => {
  if (!hostname) {
    return hostname;
  }
  if (hostname.charAt(0) === "[" && hostname.charAt(hostname.length - 1) === "]") {
    hostname = hostname.slice(1, -1);
  }
  const trimmed = hostname.replace(/\.+$/, "");
  const ipv4 = normalizeIPAddress(trimmed);
  if (ipv4 !== trimmed) {
    return ipv4;
  }
  return unmapIPv4MappedIPv6(trimmed);
};
function shouldBypassProxy(location) {
  let parsed;
  try {
    parsed = new URL(location);
  } catch (_err) {
    return false;
  }
  const noProxy = (process.env.no_proxy || process.env.NO_PROXY || "").toLowerCase();
  if (!noProxy) {
    return false;
  }
  if (noProxy === "*") {
    return true;
  }
  const port = Number.parseInt(parsed.port, 10) || DEFAULT_PORTS2[parsed.protocol.split(":", 1)[0]] || 0;
  const hostname = normalizeNoProxyHost(parsed.hostname.toLowerCase());
  return noProxy.split(/[\s,]+/).some((entry) => {
    if (!entry) {
      return false;
    }
    if (entry === "*") {
      return true;
    }
    let [entryHost, entryPort] = parseNoProxyEntry(entry);
    entryHost = normalizeNoProxyHost(entryHost);
    if (!entryHost) {
      return false;
    }
    if (entryPort && entryPort !== port) {
      return false;
    }
    if (entryHost.charAt(0) === "*") {
      entryHost = entryHost.slice(1);
    }
    if (entryHost.charAt(0) === ".") {
      return hostname.endsWith(entryHost);
    }
    return hostname === entryHost || isLoopback(hostname) && isLoopback(entryHost);
  });
}

// adapters/node_modules/axios/lib/helpers/progressEventReducer.js
init_define_MACRO();

// adapters/node_modules/axios/lib/helpers/speedometer.js
init_define_MACRO();
function speedometer(samplesCount, min) {
  samplesCount = samplesCount || 10;
  const bytes = new Array(samplesCount);
  const timestamps = new Array(samplesCount);
  let head = 0;
  let tail = 0;
  let firstSampleTS;
  min = min !== void 0 ? min : 1e3;
  return function push(chunkLength) {
    const now = Date.now();
    const startedAt = timestamps[tail];
    if (!firstSampleTS) {
      firstSampleTS = now;
    }
    bytes[head] = chunkLength;
    timestamps[head] = now;
    let i = tail;
    let bytesCount = 0;
    while (i !== head) {
      bytesCount += bytes[i++];
      i = i % samplesCount;
    }
    head = (head + 1) % samplesCount;
    if (head === tail) {
      tail = (tail + 1) % samplesCount;
    }
    if (now - firstSampleTS < min) {
      return;
    }
    const passed = startedAt && now - startedAt;
    return passed ? Math.round(bytesCount * 1e3 / passed) : void 0;
  };
}
var speedometer_default = speedometer;

// adapters/node_modules/axios/lib/helpers/throttle.js
init_define_MACRO();
function throttle(fn, freq) {
  let timestamp = 0;
  let threshold = 1e3 / freq;
  let lastArgs;
  let timer;
  const invoke = (args, now = Date.now()) => {
    timestamp = now;
    lastArgs = null;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    fn(...args);
  };
  const throttled = (...args) => {
    const now = Date.now();
    const passed = now - timestamp;
    if (passed >= threshold) {
      invoke(args, now);
    } else {
      lastArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          invoke(lastArgs);
        }, threshold - passed);
      }
    }
  };
  const flush = () => lastArgs && invoke(lastArgs);
  return [throttled, flush];
}
var throttle_default = throttle;

// adapters/node_modules/axios/lib/helpers/progressEventReducer.js
var progressEventReducer = (listener, isDownloadStream, freq = 3) => {
  let bytesNotified = 0;
  const _speedometer = speedometer_default(50, 250);
  return throttle_default((e) => {
    if (!e || typeof e.loaded !== "number") {
      return;
    }
    const rawLoaded = e.loaded;
    const total = e.lengthComputable ? e.total : void 0;
    const loaded = Math.max(0, total != null ? Math.min(rawLoaded, total) : rawLoaded);
    const progressBytes = Math.max(0, loaded - bytesNotified);
    const rate = _speedometer(progressBytes);
    bytesNotified = Math.max(bytesNotified, loaded);
    const data = {
      loaded,
      total,
      progress: total ? loaded / total : void 0,
      bytes: progressBytes,
      rate: rate ? rate : void 0,
      estimated: rate && total ? (total - loaded) / rate : void 0,
      event: e,
      lengthComputable: total != null,
      [isDownloadStream ? "download" : "upload"]: true
    };
    listener(data);
  }, freq);
};
var progressEventDecorator = (total, throttled) => {
  const lengthComputable = total != null;
  return [
    (loaded) => throttled[0]({
      lengthComputable,
      total,
      loaded
    }),
    throttled[1]
  ];
};
var asyncDecorator = (fn, scheduler = utils_default.asap) => (...args) => scheduler(() => fn(...args));

// adapters/node_modules/axios/lib/helpers/estimateDataURLDecodedBytes.js
init_define_MACRO();
var isHexDigit = (charCode) => charCode >= 48 && charCode <= 57 || charCode >= 65 && charCode <= 70 || charCode >= 97 && charCode <= 102;
var isPercentEncodedByte = (str, i, len) => i + 2 < len && isHexDigit(str.charCodeAt(i + 1)) && isHexDigit(str.charCodeAt(i + 2));
var hexValue = (charCode) => charCode <= 57 ? charCode - 48 : (charCode & 223) - 55;
var isBase64Char = (charCode) => charCode >= 65 && charCode <= 90 || // A-Z
charCode >= 97 && charCode <= 122 || // a-z
charCode >= 48 && charCode <= 57 || // 0-9
charCode === 43 || // +
charCode === 47 || // /
charCode === 45 || // - (base64url)
charCode === 95;
var isBase64Whitespace = (charCode) => charCode === 9 || charCode === 10 || charCode === 12 || charCode === 13 || charCode === 32;
var base64Bytes = (significant) => {
  const groups = Math.floor(significant / 4);
  const remainder = significant % 4;
  return groups * 3 + (remainder === 2 ? 1 : remainder === 3 ? 2 : 0);
};
var estimateBase64BufferAllocation = (body) => {
  const len = body.length;
  let padding = 0;
  if (len > 0 && body.charCodeAt(len - 1) === 61) {
    padding++;
    if (len > 1 && body.charCodeAt(len - 2) === 61) {
      padding++;
    }
  }
  return Math.floor((len - padding) * 3 / 4);
};
var estimatePercentDecodedBase64Bytes = (body) => {
  const len = body.length;
  let significant = 0;
  let padding = 0;
  let invalid = false;
  for (let i = 0; i < len; i++) {
    let code = body.charCodeAt(i);
    if (code === 37 && isPercentEncodedByte(body, i, len)) {
      code = hexValue(body.charCodeAt(i + 1)) * 16 + hexValue(body.charCodeAt(i + 2));
      i += 2;
    }
    if (isBase64Whitespace(code)) {
      continue;
    }
    if (code === 61) {
      padding++;
      continue;
    }
    if (!isBase64Char(code) || padding > 0) {
      invalid = true;
      continue;
    }
    significant++;
  }
  if (invalid || padding > 2 || padding > 0 && (significant + padding) % 4 !== 0 || significant % 4 === 1) {
    return estimateBase64BufferAllocation(body);
  }
  return base64Bytes(significant);
};
var estimateDataURLBytes = (url2, estimateBase64) => {
  if (!url2 || typeof url2 !== "string") return 0;
  if (!url2.startsWith("data:")) return 0;
  const comma = url2.indexOf(",");
  if (comma < 0) return 0;
  const meta = url2.slice(5, comma);
  const body = url2.slice(comma + 1);
  const isBase64 = /;base64/i.test(meta);
  if (isBase64) {
    return estimateBase64(body);
  }
  let bytes = 0;
  for (let i = 0, len = body.length; i < len; i++) {
    const c = body.charCodeAt(i);
    if (c === 37 && isPercentEncodedByte(body, i, len)) {
      bytes += 1;
      i += 2;
    } else if (c < 128) {
      bytes += 1;
    } else if (c < 2048) {
      bytes += 2;
    } else if (c >= 55296 && c <= 56319 && i + 1 < len) {
      const next = body.charCodeAt(i + 1);
      if (next >= 56320 && next <= 57343) {
        bytes += 4;
        i++;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
};
function estimateDataURLDecodedBytes(url2) {
  const fragmentIndex = typeof url2 === "string" ? url2.indexOf("#") : -1;
  return estimateDataURLBytes(
    fragmentIndex === -1 ? url2 : url2.slice(0, fragmentIndex),
    estimatePercentDecodedBase64Bytes
  );
}
function estimateDataURLBufferAllocation(url2) {
  return estimateDataURLBytes(url2, estimateBase64BufferAllocation);
}

// adapters/node_modules/axios/lib/adapters/http.js
var zlibOptions = {
  flush: zlib.constants.Z_SYNC_FLUSH,
  finishFlush: zlib.constants.Z_SYNC_FLUSH
};
var brotliOptions = {
  flush: zlib.constants.BROTLI_OPERATION_FLUSH,
  finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH
};
var zstdOptions = {
  flush: zlib.constants.ZSTD_e_flush,
  finishFlush: zlib.constants.ZSTD_e_flush
};
var isBrotliSupported = utils_default.isFunction(zlib.createBrotliDecompress);
var isZstdSupported = utils_default.isFunction(zlib.createZstdDecompress);
var ACCEPT_ENCODING = "gzip, compress, deflate" + (isBrotliSupported ? ", br" : "");
var ACCEPT_ENCODING_WITH_ZSTD = ACCEPT_ENCODING + (isZstdSupported ? ", zstd" : "");
var scheduleProgress = typeof process !== "undefined" && process.nextTick ? process.nextTick.bind(process) : utils_default.asap;
var { http: httpFollow, https: httpsFollow } = import_follow_redirects.default;
var isHttps = /https:?/;
var kAxiosSocketListener = /* @__PURE__ */ Symbol("axios.http.socketListener");
var kAxiosCurrentReq = /* @__PURE__ */ Symbol("axios.http.currentReq");
var kAxiosInstalledTunnel = /* @__PURE__ */ Symbol("axios.http.installedTunnel");
var tunnelingAgentCache = /* @__PURE__ */ new Map();
var tunnelingAgentCacheUser = /* @__PURE__ */ new WeakMap();
var NODE_NATIVE_ENV_PROXY_SUPPORT = {
  22: 21,
  24: 5
};
function isNodeNativeEnvProxySupported(nodeVersion = process.versions && process.versions.node) {
  if (!nodeVersion) {
    return false;
  }
  const [major, minor] = nodeVersion.split(".").map((part) => Number(part));
  if (!Number.isInteger(major) || !Number.isInteger(minor)) {
    return false;
  }
  if (major > 24) {
    return true;
  }
  return NODE_NATIVE_ENV_PROXY_SUPPORT[major] != null && minor >= NODE_NATIVE_ENV_PROXY_SUPPORT[major];
}
function isNodeEnvProxyEnabled(agent, nodeVersion = process.versions && process.versions.node) {
  if (!isNodeNativeEnvProxySupported(nodeVersion)) {
    return false;
  }
  const agentOptions = agent && agent.options;
  return Boolean(
    agentOptions && utils_default.hasOwnProp(agentOptions, "proxyEnv") && agentOptions.proxyEnv != null
  );
}
function getProxyEnvAgent(options, configHttpAgent, configHttpsAgent) {
  return isHttps.test(options.protocol) ? configHttpsAgent || https.globalAgent : configHttpAgent || http.globalAgent;
}
function getTunnelingAgent(agentOptions, userHttpsAgent) {
  const key = agentOptions.protocol + "//" + agentOptions.hostname + ":" + (agentOptions.port || "") + "#" + (agentOptions.auth || "");
  const cache = userHttpsAgent ? tunnelingAgentCacheUser.get(userHttpsAgent) || tunnelingAgentCacheUser.set(userHttpsAgent, /* @__PURE__ */ new Map()).get(userHttpsAgent) : tunnelingAgentCache;
  let agent = cache.get(key);
  if (agent) return agent;
  const merged = userHttpsAgent && userHttpsAgent.options ? { ...userHttpsAgent.options, ...agentOptions } : agentOptions;
  agent = new import_https_proxy_agent.default(merged);
  if (userHttpsAgent && userHttpsAgent.options) {
    const originTLSOptions = { ...userHttpsAgent.options };
    const callback = agent.callback;
    agent.callback = function axiosTunnelingAgentCallback(req, opts) {
      return callback.call(this, req, { ...originTLSOptions, ...opts });
    };
  }
  agent[kAxiosInstalledTunnel] = true;
  cache.set(key, agent);
  return agent;
}
var supportedProtocols = platform_default.protocols.map((protocol) => {
  return protocol + ":";
});
var decodeURIComponentSafe = (value) => {
  if (!utils_default.isString(value)) {
    return value;
  }
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
};
var flushOnFinish = (stream4, [throttled, flush]) => {
  stream4.on("end", flush).on("error", flush);
  return throttled;
};
var http2Sessions = new Http2Sessions_default();
function dispatchBeforeRedirect(options, responseDetails, requestDetails) {
  if (options.beforeRedirects.proxy) {
    options.beforeRedirects.proxy(options);
  }
  if (options.beforeRedirects.auth) {
    options.beforeRedirects.auth(options);
  }
  if (options.beforeRedirects.sensitiveHeaders) {
    options.beforeRedirects.sensitiveHeaders(options, requestDetails);
  }
  if (options.beforeRedirects.config) {
    options.beforeRedirects.config(options, responseDetails, requestDetails);
  }
}
function stripMatchingHeaders(headers, sensitiveSet) {
  if (!headers) {
    return;
  }
  Object.keys(headers).forEach((header) => {
    if (sensitiveSet.has(header.toLowerCase())) {
      delete headers[header];
    }
  });
}
function isSameOriginRedirect(redirectOptions, requestDetails) {
  if (!requestDetails) {
    return false;
  }
  try {
    return new URL(requestDetails.url).origin === new URL(redirectOptions.href).origin;
  } catch (e) {
    return false;
  }
}
function setProxy(options, configProxy, location, isRedirect, configHttpsAgent, configHttpAgent) {
  let proxy = configProxy;
  const proxyEnvAgent = getProxyEnvAgent(options, configHttpAgent, configHttpsAgent);
  if (!proxy && proxy !== false && !isNodeEnvProxyEnabled(proxyEnvAgent)) {
    const proxyUrl = getProxyForUrl(location);
    if (proxyUrl) {
      if (!shouldBypassProxy(location)) {
        proxy = new URL(proxyUrl);
      }
    }
  }
  if (isRedirect && options.headers) {
    for (const name of Object.keys(options.headers)) {
      if (name.toLowerCase() === "proxy-authorization") {
        delete options.headers[name];
      }
    }
  }
  if (isRedirect && options.agent && options.agent[kAxiosInstalledTunnel]) {
    options.agent = void 0;
  }
  if (proxy) {
    const isProxyURL = proxy instanceof URL;
    const readProxyField = (key) => isProxyURL || utils_default.hasOwnProp(proxy, key) ? proxy[key] : void 0;
    const proxyUsername = readProxyField("username");
    const proxyPassword = readProxyField("password");
    let proxyAuth = utils_default.hasOwnProp(proxy, "auth") ? proxy.auth : void 0;
    if (proxyUsername) {
      proxyAuth = (proxyUsername || "") + ":" + (proxyPassword || "");
    }
    if (proxyAuth) {
      const authIsObject = typeof proxyAuth === "object";
      const authUsername = authIsObject && utils_default.hasOwnProp(proxyAuth, "username") ? proxyAuth.username : void 0;
      const authPassword = authIsObject && utils_default.hasOwnProp(proxyAuth, "password") ? proxyAuth.password : void 0;
      const validProxyAuth = Boolean(authUsername || authPassword);
      if (validProxyAuth) {
        proxyAuth = (authUsername || "") + ":" + (authPassword || "");
      } else if (authIsObject) {
        throw new AxiosError_default("Invalid proxy authorization", AxiosError_default.ERR_BAD_OPTION, { proxy });
      }
    }
    const targetIsHttps = isHttps.test(options.protocol);
    if (targetIsHttps) {
      if (!(configHttpsAgent instanceof import_https_proxy_agent.default)) {
        const proxyHost = readProxyField("hostname") || readProxyField("host");
        const proxyPort = readProxyField("port");
        const rawProxyProtocol = readProxyField("protocol");
        const normalizedProtocol = rawProxyProtocol ? rawProxyProtocol.includes(":") ? rawProxyProtocol : `${rawProxyProtocol}:` : "http:";
        const proxyHostForURL = proxyHost && proxyHost.includes(":") && !proxyHost.startsWith("[") ? `[${proxyHost}]` : proxyHost;
        const proxyURL = new URL(
          `${normalizedProtocol}//${proxyHostForURL}${proxyPort ? ":" + proxyPort : ""}`
        );
        const agentOptions = {
          protocol: proxyURL.protocol,
          hostname: proxyURL.hostname.replace(/^\[|\]$/g, ""),
          port: proxyURL.port,
          auth: proxyAuth && typeof proxyAuth === "string" ? proxyAuth : void 0
        };
        if (proxyURL.protocol === "https:") {
          agentOptions.ALPNProtocols = ["http/1.1"];
        }
        const tunnelingAgent = getTunnelingAgent(agentOptions, configHttpsAgent);
        options.agent = tunnelingAgent;
        if (options.agents) {
          options.agents.https = tunnelingAgent;
        }
      }
    } else {
      if (proxyAuth) {
        const base64 = Buffer.from(proxyAuth, "utf8").toString("base64");
        options.headers["Proxy-Authorization"] = "Basic " + base64;
      }
      let hasUserHostHeader = false;
      for (const name of Object.keys(options.headers)) {
        if (name.toLowerCase() === "host") {
          hasUserHostHeader = true;
          break;
        }
      }
      if (!hasUserHostHeader) {
        options.headers.host = options.hostname + (options.port ? ":" + options.port : "");
      }
      const proxyHost = readProxyField("hostname") || readProxyField("host");
      options.hostname = proxyHost;
      options.host = proxyHost;
      options.port = readProxyField("port");
      options.path = location;
      const proxyProtocol = readProxyField("protocol");
      if (proxyProtocol) {
        options.protocol = proxyProtocol.includes(":") ? proxyProtocol : `${proxyProtocol}:`;
      }
    }
  }
  options.beforeRedirects.proxy = function beforeRedirect(redirectOptions) {
    setProxy(
      redirectOptions,
      configProxy,
      redirectOptions.href,
      true,
      configHttpsAgent,
      configHttpAgent
    );
  };
}
var isHttpAdapterSupported = typeof process !== "undefined" && utils_default.kindOf(process) === "process";
var wrapAsync = (asyncExecutor) => {
  return new Promise((resolve, reject) => {
    let onDone;
    let isDone;
    const done = (value, isRejected) => {
      if (isDone) return;
      isDone = true;
      onDone && onDone(value, isRejected);
    };
    const _resolve = (value) => {
      done(value);
      resolve(value);
    };
    const _reject = (reason) => {
      done(reason, true);
      reject(reason);
    };
    asyncExecutor(_resolve, _reject, (onDoneHandler) => onDone = onDoneHandler).catch(_reject);
  });
};
var resolveFamily = ({ address, family }) => {
  if (!utils_default.isString(address)) {
    throw TypeError("address must be a string");
  }
  return {
    address,
    family: family || (address.indexOf(".") < 0 ? 6 : 4)
  };
};
var buildAddressEntry = (address, family) => resolveFamily(utils_default.isObject(address) ? address : { address, family });
var http2Transport = {
  request(options, cb) {
    const authority = options.protocol + "//" + options.hostname + ":" + (options.port || (options.protocol === "https:" ? 443 : 80));
    const { http2Options, headers } = options;
    const session = http2Sessions.getSession(authority, http2Options);
    const { HTTP2_HEADER_SCHEME, HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH, HTTP2_HEADER_STATUS } = http22.constants;
    const http2Headers = {
      [HTTP2_HEADER_SCHEME]: options.protocol.replace(":", ""),
      [HTTP2_HEADER_METHOD]: options.method,
      [HTTP2_HEADER_PATH]: options.path
    };
    utils_default.forEach(headers, (header, name) => {
      name.charAt(0) !== ":" && (http2Headers[name] = header);
    });
    const req = session.request(http2Headers);
    req.once("response", (responseHeaders) => {
      const response = req;
      responseHeaders = Object.assign({}, responseHeaders);
      const status = responseHeaders[HTTP2_HEADER_STATUS];
      delete responseHeaders[HTTP2_HEADER_STATUS];
      response.headers = responseHeaders;
      response.statusCode = +status;
      cb(response);
    });
    return req;
  }
};
var http_default = isHttpAdapterSupported && function httpAdapter(config2) {
  return wrapAsync(async function dispatchHttpRequest(resolve, reject, onDone) {
    const own2 = (key) => utils_default.getSafeProp(config2, key);
    const transitional2 = own2("transitional") || transitional_default;
    let data = own2("data");
    let lookup = own2("lookup");
    let family = own2("family");
    let httpVersion = own2("httpVersion");
    if (httpVersion === void 0) httpVersion = 1;
    let http2Options = own2("http2Options");
    const httpAgent = own2("httpAgent");
    const httpsAgent = own2("httpsAgent");
    const configProxy = own2("proxy");
    const responseType = own2("responseType");
    const responseEncoding = own2("responseEncoding");
    const socketPath = own2("socketPath");
    const method = own2("method").toUpperCase();
    const maxRedirects = own2("maxRedirects");
    const maxBodyLength = own2("maxBodyLength");
    const maxContentLength = own2("maxContentLength");
    const decompress = own2("decompress");
    let isDone;
    let rejected = false;
    let req;
    let connectPhaseTimer;
    httpVersion = +httpVersion;
    if (Number.isNaN(httpVersion)) {
      throw TypeError(`Invalid protocol version: '${config2.httpVersion}' is not a number`);
    }
    if (httpVersion !== 1 && httpVersion !== 2) {
      throw TypeError(`Unsupported protocol version '${httpVersion}'`);
    }
    const isHttp2 = httpVersion === 2;
    if (lookup) {
      const _lookup = callbackify_default(lookup, (value) => utils_default.isArray(value) ? value : [value]);
      lookup = (hostname, opt, cb) => {
        _lookup(hostname, opt, (err, arg0, arg1) => {
          if (err) {
            return cb(err);
          }
          const addresses = utils_default.isArray(arg0) ? arg0.map((addr) => buildAddressEntry(addr)) : [buildAddressEntry(arg0, arg1)];
          opt.all ? cb(err, addresses) : cb(err, addresses[0].address, addresses[0].family);
        });
      };
    }
    const abortEmitter = new EventEmitter();
    function abort(reason) {
      try {
        abortEmitter.emit(
          "abort",
          !reason || reason.type ? new CanceledError_default(null, config2, req) : reason
        );
      } catch (err) {
      }
    }
    function clearConnectPhaseTimer() {
      if (connectPhaseTimer) {
        clearTimeout(connectPhaseTimer);
        connectPhaseTimer = null;
      }
    }
    function createTimeoutError() {
      const configTimeout = own2("timeout");
      let timeoutErrorMessage = configTimeout ? "timeout of " + configTimeout + "ms exceeded" : "timeout exceeded";
      const configTimeoutErrorMessage = own2("timeoutErrorMessage");
      if (configTimeoutErrorMessage) {
        timeoutErrorMessage = configTimeoutErrorMessage;
      }
      return new AxiosError_default(
        timeoutErrorMessage,
        transitional2.clarifyTimeoutError ? AxiosError_default.ETIMEDOUT : AxiosError_default.ECONNABORTED,
        config2,
        req
      );
    }
    abortEmitter.once("abort", reject);
    const onFinished = () => {
      clearConnectPhaseTimer();
      if (config2.cancelToken) {
        config2.cancelToken.unsubscribe(abort);
      }
      if (config2.signal) {
        config2.signal.removeEventListener("abort", abort);
      }
      abortEmitter.removeAllListeners();
    };
    if (config2.cancelToken || config2.signal) {
      config2.cancelToken && config2.cancelToken.subscribe(abort);
      if (config2.signal) {
        config2.signal.aborted ? abort() : config2.signal.addEventListener("abort", abort);
      }
    }
    onDone((response, isRejected) => {
      isDone = true;
      clearConnectPhaseTimer();
      if (isRejected) {
        rejected = true;
        onFinished();
        return;
      }
      const { data: data2 } = response;
      if (data2 instanceof stream3.Readable || data2 instanceof stream3.Duplex) {
        const offListeners = stream3.finished(data2, () => {
          offListeners();
          onFinished();
        });
      } else {
        onFinished();
      }
    });
    const fullPath = buildFullPath(own2("baseURL"), own2("url"), own2("allowAbsoluteUrls"), config2);
    const urlBase = socketPath ? "http://localhost" : platform_default.hasBrowserEnv ? platform_default.origin : void 0;
    const parsed = new URL(fullPath, urlBase);
    const protocol = parsed.protocol || supportedProtocols[0];
    if (protocol === "data:") {
      if (maxContentLength > -1) {
        const dataUrl = String(own2("url") || fullPath || "");
        const estimated = estimateDataURLBufferAllocation(dataUrl);
        if (estimated > maxContentLength) {
          return reject(
            new AxiosError_default(
              "maxContentLength size of " + maxContentLength + " exceeded",
              AxiosError_default.ERR_BAD_RESPONSE,
              config2
            )
          );
        }
      }
      let convertedData;
      if (method !== "GET") {
        return settle(resolve, reject, {
          status: 405,
          statusText: "method not allowed",
          headers: {},
          config: config2
        });
      }
      try {
        convertedData = fromDataURI(own2("url"), responseType === "blob", {
          Blob: config2.env && config2.env.Blob
        });
      } catch (err) {
        throw AxiosError_default.from(err, AxiosError_default.ERR_BAD_REQUEST, config2);
      }
      if (responseType === "text") {
        convertedData = convertedData.toString(responseEncoding);
        if (!responseEncoding || responseEncoding === "utf8") {
          convertedData = utils_default.stripBOM(convertedData);
        }
      } else if (responseType === "stream") {
        convertedData = stream3.Readable.from(convertedData);
      }
      return settle(resolve, reject, {
        data: convertedData,
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders_default(),
        config: config2
      });
    }
    if (supportedProtocols.indexOf(protocol) === -1) {
      return reject(
        new AxiosError_default("Unsupported protocol " + protocol, AxiosError_default.ERR_BAD_REQUEST, config2)
      );
    }
    const headers = AxiosHeaders_default.from(config2.headers).normalize();
    headers.set("User-Agent", "axios/" + VERSION, false);
    const { onUploadProgress, onDownloadProgress } = config2;
    const maxRate = config2.maxRate;
    let maxUploadRate = void 0;
    let maxDownloadRate = void 0;
    if (utils_default.isSpecCompliantForm(data)) {
      const userBoundary = headers.getContentType(/boundary=([-_\w\d]{10,70})/i);
      data = formDataToStream_default(
        data,
        (formHeaders) => {
          headers.set(formHeaders);
        },
        {
          tag: `axios-${VERSION}-boundary`,
          boundary: userBoundary && userBoundary[1] || void 0
        }
      );
    } else if (utils_default.isFormData(data) && utils_default.isFunction(data.getHeaders) && data.getHeaders !== Object.prototype.getHeaders) {
      setFormDataHeaders(headers, data.getHeaders(), own2("formDataHeaderPolicy"));
      if (!headers.hasContentLength()) {
        try {
          const knownLength = await util3.promisify(data.getLength).call(data);
          Number.isFinite(knownLength) && knownLength >= 0 && headers.setContentLength(knownLength);
        } catch (e) {
        }
      }
    } else if (utils_default.isBlob(data) || utils_default.isFile(data)) {
      data.size && headers.setContentType(data.type || "application/octet-stream");
      headers.setContentLength(data.size || 0);
      data = stream3.Readable.from(readBlob_default(data));
    } else if (data && !utils_default.isStream(data)) {
      if (Buffer.isBuffer(data)) {
      } else if (utils_default.isArrayBuffer(data)) {
        data = Buffer.from(new Uint8Array(data));
      } else if (utils_default.isString(data)) {
        data = Buffer.from(data, "utf-8");
      } else {
        return reject(
          new AxiosError_default(
            "Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream",
            AxiosError_default.ERR_BAD_REQUEST,
            config2
          )
        );
      }
      headers.setContentLength(data.length, false);
      if (maxBodyLength > -1 && data.length > maxBodyLength) {
        return reject(
          new AxiosError_default(
            "Request body larger than maxBodyLength limit",
            AxiosError_default.ERR_BAD_REQUEST,
            config2
          )
        );
      }
    }
    const contentLength = utils_default.toFiniteNumber(headers.getContentLength());
    if (utils_default.isArray(maxRate)) {
      maxUploadRate = maxRate[0];
      maxDownloadRate = maxRate[1];
    } else {
      maxUploadRate = maxDownloadRate = maxRate;
    }
    if (data && (onUploadProgress || maxUploadRate)) {
      if (!utils_default.isStream(data)) {
        data = stream3.Readable.from(data, { objectMode: false });
      }
      data = stream3.pipeline(
        [
          data,
          new AxiosTransformStream_default({
            maxRate: utils_default.toFiniteNumber(maxUploadRate)
          })
        ],
        utils_default.noop
      );
      onUploadProgress && data.on(
        "progress",
        flushOnFinish(
          data,
          progressEventDecorator(
            contentLength,
            progressEventReducer(asyncDecorator(onUploadProgress, scheduleProgress), false, 3)
          )
        )
      );
    }
    let auth = void 0;
    const configAuth = own2("auth");
    if (configAuth) {
      const username = utils_default.getSafeProp(configAuth, "username") || "";
      const password = utils_default.getSafeProp(configAuth, "password") || "";
      auth = username + ":" + password;
    }
    if (!auth && (parsed.username || parsed.password)) {
      const urlUsername = decodeURIComponentSafe(parsed.username);
      const urlPassword = decodeURIComponentSafe(parsed.password);
      auth = urlUsername + ":" + urlPassword;
    }
    auth && headers.delete("authorization");
    let path3;
    try {
      path3 = buildURL(
        parsed.pathname + parsed.search,
        own2("params"),
        own2("paramsSerializer")
      ).replace(/^\?/, "");
    } catch (err) {
      return reject(
        AxiosError_default.from(err, AxiosError_default.ERR_BAD_REQUEST, config2, null, null, {
          url: own2("url"),
          exists: true
        })
      );
    }
    headers.set(
      "Accept-Encoding",
      utils_default.hasOwnProp(transitional2, "advertiseZstdAcceptEncoding") && transitional2.advertiseZstdAcceptEncoding === true ? ACCEPT_ENCODING_WITH_ZSTD : ACCEPT_ENCODING,
      false
    );
    const options = Object.assign(/* @__PURE__ */ Object.create(null), {
      path: path3,
      method,
      headers: toByteStringHeaderObject(headers),
      agents: { http: httpAgent, https: httpsAgent },
      auth,
      protocol,
      family,
      beforeRedirect: dispatchBeforeRedirect,
      beforeRedirects: /* @__PURE__ */ Object.create(null),
      http2Options
    });
    !utils_default.isUndefined(lookup) && (options.lookup = lookup);
    if (socketPath) {
      if (typeof socketPath !== "string") {
        return reject(
          new AxiosError_default("socketPath must be a string", AxiosError_default.ERR_BAD_OPTION_VALUE, config2)
        );
      }
      const allowedSocketPaths = own2("allowedSocketPaths");
      if (allowedSocketPaths != null) {
        const allowed = Array.isArray(allowedSocketPaths) ? allowedSocketPaths : [allowedSocketPaths];
        const resolvedSocket = resolvePath(socketPath);
        const isAllowed = allowed.some(
          (entry) => typeof entry === "string" && resolvePath(entry) === resolvedSocket
        );
        if (!isAllowed) {
          return reject(
            new AxiosError_default(
              `socketPath "${socketPath}" is not permitted by allowedSocketPaths`,
              AxiosError_default.ERR_BAD_OPTION_VALUE,
              config2
            )
          );
        }
      }
      options.socketPath = socketPath;
    } else {
      options.hostname = parsed.hostname.startsWith("[") ? parsed.hostname.slice(1, -1) : parsed.hostname;
      options.port = parsed.port;
      setProxy(
        options,
        configProxy,
        protocol + "//" + parsed.hostname + (parsed.port ? ":" + parsed.port : "") + options.path,
        false,
        httpsAgent,
        httpAgent
      );
    }
    let transport;
    let isNativeTransport = false;
    let transportEnforcesMaxBodyLength = false;
    const isHttpsRequest = isHttps.test(options.protocol);
    if (options.agent == null) {
      options.agent = isHttpsRequest ? httpsAgent : httpAgent;
    }
    if (isHttp2) {
      transport = http2Transport;
    } else {
      const configTransport = own2("transport");
      if (configTransport) {
        transport = configTransport;
      } else if (maxRedirects === 0) {
        transport = isHttpsRequest ? https : http;
        isNativeTransport = true;
      } else {
        transportEnforcesMaxBodyLength = true;
        options.sensitiveHeaders = [];
        if (maxRedirects) {
          options.maxRedirects = maxRedirects;
        }
        const configBeforeRedirect = own2("beforeRedirect");
        if (configBeforeRedirect) {
          options.beforeRedirects.config = configBeforeRedirect;
        }
        if (auth) {
          const requestOrigin = parsed.origin;
          const authToRestore = auth;
          options.beforeRedirects.auth = function beforeRedirectAuth(redirectOptions) {
            try {
              if (new URL(redirectOptions.href).origin === requestOrigin) {
                redirectOptions.auth = authToRestore;
              }
            } catch (e) {
            }
          };
        }
        const sensitiveHeaders = own2("sensitiveHeaders");
        if (sensitiveHeaders != null) {
          if (!utils_default.isArray(sensitiveHeaders)) {
            return reject(
              new AxiosError_default(
                "sensitiveHeaders must be an array of strings",
                AxiosError_default.ERR_BAD_OPTION_VALUE,
                config2
              )
            );
          }
          const sensitiveSet = /* @__PURE__ */ new Set();
          for (const header of sensitiveHeaders) {
            if (!utils_default.isString(header)) {
              return reject(
                new AxiosError_default(
                  "sensitiveHeaders must be an array of strings",
                  AxiosError_default.ERR_BAD_OPTION_VALUE,
                  config2
                )
              );
            }
            sensitiveSet.add(header.toLowerCase());
          }
          if (sensitiveSet.size) {
            options.sensitiveHeaders = Array.from(sensitiveSet);
            options.beforeRedirects.sensitiveHeaders = function beforeRedirectSensitiveHeaders(redirectOptions, requestDetails) {
              if (!isSameOriginRedirect(redirectOptions, requestDetails)) {
                stripMatchingHeaders(redirectOptions.headers, sensitiveSet);
              }
            };
          }
        }
        transport = isHttpsRequest ? httpsFollow : httpFollow;
      }
    }
    if (maxBodyLength > -1) {
      options.maxBodyLength = maxBodyLength;
    } else {
      options.maxBodyLength = Infinity;
    }
    options.insecureHTTPParser = Boolean(own2("insecureHTTPParser"));
    req = transport.request(options, function handleResponse(res) {
      clearConnectPhaseTimer();
      if (req.destroyed) return;
      const streams = [res];
      const responseLength = utils_default.toFiniteNumber(res.headers["content-length"]);
      if (onDownloadProgress || maxDownloadRate) {
        const transformStream = new AxiosTransformStream_default({
          maxRate: utils_default.toFiniteNumber(maxDownloadRate)
        });
        onDownloadProgress && transformStream.on(
          "progress",
          flushOnFinish(
            transformStream,
            progressEventDecorator(
              responseLength,
              progressEventReducer(asyncDecorator(onDownloadProgress, scheduleProgress), true, 3)
            )
          )
        );
        streams.push(transformStream);
      }
      let responseStream = res;
      const lastRequest = res.req || req;
      if (decompress !== false && res.headers["content-encoding"]) {
        if (method === "HEAD" || res.statusCode === 204) {
          delete res.headers["content-encoding"];
        }
        switch ((res.headers["content-encoding"] || "").toLowerCase()) {
          /*eslint default-case:0*/
          case "gzip":
          case "x-gzip":
          case "compress":
          case "x-compress":
            streams.push(zlib.createUnzip(zlibOptions));
            delete res.headers["content-encoding"];
            break;
          case "deflate":
            streams.push(new ZlibHeaderTransformStream_default());
            streams.push(zlib.createUnzip(zlibOptions));
            delete res.headers["content-encoding"];
            break;
          case "br":
            if (isBrotliSupported) {
              streams.push(zlib.createBrotliDecompress(brotliOptions));
              delete res.headers["content-encoding"];
            }
            break;
          case "zstd":
            if (isZstdSupported) {
              streams.push(zlib.createZstdDecompress(zstdOptions));
              delete res.headers["content-encoding"];
            }
            break;
        }
      }
      responseStream = streams.length > 1 ? stream3.pipeline(streams, utils_default.noop) : streams[0];
      const response = {
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: new AxiosHeaders_default(res.headers),
        config: config2,
        request: lastRequest
      };
      if (responseType === "stream") {
        if (maxContentLength > -1) {
          const limit = maxContentLength;
          const source = responseStream;
          async function* enforceMaxContentLength() {
            let totalResponseBytes = 0;
            for await (const chunk of source) {
              totalResponseBytes += chunk.length;
              if (totalResponseBytes > limit) {
                throw new AxiosError_default(
                  "maxContentLength size of " + limit + " exceeded",
                  AxiosError_default.ERR_BAD_RESPONSE,
                  config2,
                  lastRequest
                );
              }
              yield chunk;
            }
          }
          responseStream = stream3.Readable.from(enforceMaxContentLength(), {
            objectMode: false
          });
        }
        response.data = responseStream;
        settle(resolve, reject, response);
      } else {
        const responseBuffer = [];
        let totalResponseBytes = 0;
        responseStream.on("data", function handleStreamData(chunk) {
          responseBuffer.push(chunk);
          totalResponseBytes += chunk.length;
          if (maxContentLength > -1 && totalResponseBytes > maxContentLength) {
            rejected = true;
            responseStream.destroy();
            abort(
              new AxiosError_default(
                "maxContentLength size of " + maxContentLength + " exceeded",
                AxiosError_default.ERR_BAD_RESPONSE,
                config2,
                lastRequest
              )
            );
          }
        });
        responseStream.on("aborted", function handlerStreamAborted() {
          if (rejected) {
            return;
          }
          const err = new AxiosError_default(
            "stream has been aborted",
            AxiosError_default.ERR_BAD_RESPONSE,
            config2,
            lastRequest,
            response
          );
          responseStream.destroy(err);
          reject(err);
        });
        responseStream.on("error", function handleStreamError(err) {
          if (rejected) return;
          reject(AxiosError_default.from(err, null, config2, lastRequest, response));
        });
        responseStream.on("end", function handleStreamEnd() {
          try {
            let responseData = responseBuffer.length === 1 ? responseBuffer[0] : Buffer.concat(responseBuffer);
            if (responseType !== "arraybuffer") {
              responseData = responseData.toString(responseEncoding);
              if (!responseEncoding || responseEncoding === "utf8") {
                responseData = utils_default.stripBOM(responseData);
              }
            }
            response.data = responseData;
          } catch (err) {
            return reject(AxiosError_default.from(err, null, config2, response.request, response));
          }
          settle(resolve, reject, response);
        });
      }
      abortEmitter.once("abort", (err) => {
        if (!responseStream.destroyed) {
          responseStream.emit("error", err);
          responseStream.destroy();
        }
      });
    });
    abortEmitter.once("abort", (err) => {
      if (req.close) {
        req.close();
      } else {
        req.destroy(err);
      }
    });
    req.on("error", function handleRequestError(err) {
      reject(AxiosError_default.from(err, null, config2, req));
    });
    const boundSockets = /* @__PURE__ */ new Set();
    req.on("socket", function handleRequestSocket(socket) {
      if (typeof socket.setKeepAlive === "function") {
        socket.setKeepAlive(true, 1e3 * 60);
      }
      if (!socket[kAxiosSocketListener]) {
        socket.on("error", function handleSocketError(err) {
          const current = socket[kAxiosCurrentReq];
          if (current && !current.destroyed) {
            current.destroy(err);
          }
        });
        socket[kAxiosSocketListener] = true;
      }
      socket[kAxiosCurrentReq] = req;
      boundSockets.add(socket);
    });
    req.once("close", function clearCurrentReq() {
      clearConnectPhaseTimer();
      for (const socket of boundSockets) {
        if (socket[kAxiosCurrentReq] === req) {
          socket[kAxiosCurrentReq] = null;
        }
      }
      boundSockets.clear();
    });
    if (own2("timeout")) {
      const timeout = parseInt(own2("timeout"), 10);
      if (Number.isNaN(timeout)) {
        abort(
          new AxiosError_default(
            "error trying to parse `config.timeout` to int",
            AxiosError_default.ERR_BAD_OPTION_VALUE,
            config2,
            req
          )
        );
        return;
      }
      const handleTimeout = function handleTimeout2() {
        if (isDone) return;
        abort(createTimeoutError());
      };
      if (isNativeTransport && timeout > 0) {
        connectPhaseTimer = setTimeout(handleTimeout, timeout);
      }
      req.setTimeout(timeout, handleTimeout);
    } else {
      req.setTimeout(0);
    }
    if (utils_default.isStream(data)) {
      let ended = false;
      let errored = false;
      data.on("end", () => {
        ended = true;
      });
      data.once("error", (err) => {
        errored = true;
        req.destroy(err);
      });
      data.on("close", () => {
        if (!ended && !errored) {
          abort(new CanceledError_default("Request stream has been aborted", config2, req));
        }
      });
      let uploadStream = data;
      if (maxBodyLength > -1 && !transportEnforcesMaxBodyLength) {
        const limit = maxBodyLength;
        let bytesSent = 0;
        uploadStream = stream3.pipeline(
          [
            data,
            new stream3.Transform({
              transform(chunk, _enc, cb) {
                bytesSent += chunk.length;
                if (bytesSent > limit) {
                  return cb(
                    new AxiosError_default(
                      "Request body larger than maxBodyLength limit",
                      AxiosError_default.ERR_BAD_REQUEST,
                      config2,
                      req
                    )
                  );
                }
                cb(null, chunk);
              }
            })
          ],
          utils_default.noop
        );
        uploadStream.on("error", (err) => {
          if (!req.destroyed) req.destroy(err);
        });
      }
      uploadStream.pipe(req);
    } else {
      data && req.write(data);
      req.end();
    }
  });
};

// adapters/node_modules/axios/lib/adapters/xhr.js
init_define_MACRO();

// adapters/node_modules/axios/lib/helpers/resolveConfig.js
init_define_MACRO();

// adapters/node_modules/axios/lib/helpers/isURLSameOrigin.js
init_define_MACRO();
var isURLSameOrigin_default = platform_default.hasStandardBrowserEnv ? /* @__PURE__ */ ((origin2, isMSIE) => (url2) => {
  url2 = new URL(url2, platform_default.origin);
  return origin2.protocol === url2.protocol && origin2.host === url2.host && (isMSIE || origin2.port === url2.port);
})(
  new URL(platform_default.origin),
  platform_default.navigator && /(msie|trident)/i.test(platform_default.navigator.userAgent)
) : () => true;

// adapters/node_modules/axios/lib/helpers/cookies.js
init_define_MACRO();
var cookies_default = platform_default.hasStandardBrowserEnv ? (
  // Standard browser envs support document.cookie
  {
    write(name, value, expires, path3, domain, secure, sameSite) {
      if (typeof document === "undefined") return;
      const cookie = [`${name}=${encodeURIComponent(value)}`];
      if (utils_default.isNumber(expires)) {
        cookie.push(`expires=${new Date(expires).toUTCString()}`);
      }
      if (utils_default.isString(path3)) {
        cookie.push(`path=${path3}`);
      }
      if (utils_default.isString(domain)) {
        cookie.push(`domain=${domain}`);
      }
      if (secure === true) {
        cookie.push("secure");
      }
      if (utils_default.isString(sameSite)) {
        cookie.push(`SameSite=${sameSite}`);
      }
      document.cookie = cookie.join("; ");
    },
    read(name) {
      if (typeof document === "undefined") return null;
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].replace(/^\s+/, "");
        const eq = cookie.indexOf("=");
        if (eq !== -1 && cookie.slice(0, eq) === name) {
          try {
            return decodeURIComponent(cookie.slice(eq + 1));
          } catch (e) {
            return cookie.slice(eq + 1);
          }
        }
      }
      return null;
    },
    remove(name) {
      this.write(name, "", Date.now() - 864e5, "/");
    }
  }
) : (
  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {
    },
    read() {
      return null;
    },
    remove() {
    }
  }
);

// adapters/node_modules/axios/lib/core/mergeConfig.js
init_define_MACRO();
var headersToObject = (thing) => thing instanceof AxiosHeaders_default ? { ...thing } : thing;
var ownEnumerableKeys = (thing) => {
  if (Object.getOwnPropertySymbols && Object.getOwnPropertyDescriptor) {
    return Object.keys(thing).concat(
      Object.getOwnPropertySymbols(thing).filter(
        (symbol) => Object.getOwnPropertyDescriptor(thing, symbol).enumerable
      )
    );
  }
  return Object.keys(thing);
};
function mergeConfig(config1, config2) {
  config1 = config1 || {};
  config2 = config2 || {};
  const config3 = /* @__PURE__ */ Object.create(null);
  Object.defineProperty(config3, "hasOwnProperty", {
    // Null-proto descriptor so a polluted Object.prototype.get cannot turn
    // this data descriptor into an accessor descriptor on the way in.
    __proto__: null,
    value: Object.prototype.hasOwnProperty,
    enumerable: false,
    writable: true,
    configurable: true
  });
  function getMergedValue(target, source, prop, caseless) {
    if (utils_default.isPlainObject(target) && utils_default.isPlainObject(source)) {
      return utils_default.merge.call({ caseless }, target, source);
    } else if (utils_default.isPlainObject(source)) {
      return utils_default.merge({}, source);
    } else if (utils_default.isArray(source)) {
      return source.slice();
    }
    return source;
  }
  function mergeDeepProperties(a, b, prop, caseless) {
    if (!utils_default.isUndefined(b)) {
      return getMergedValue(a, b, prop, caseless);
    } else if (!utils_default.isUndefined(a)) {
      return getMergedValue(void 0, a, prop, caseless);
    }
  }
  function valueFromConfig2(a, b) {
    if (!utils_default.isUndefined(b)) {
      return getMergedValue(void 0, b);
    }
  }
  function defaultToConfig2(a, b) {
    if (!utils_default.isUndefined(b)) {
      return getMergedValue(void 0, b);
    } else if (!utils_default.isUndefined(a)) {
      return getMergedValue(void 0, a);
    }
  }
  function getMergedTransitionalOption(prop) {
    const transitional2 = utils_default.hasOwnProp(config2, "transitional") ? config2.transitional : void 0;
    if (!utils_default.isUndefined(transitional2)) {
      if (utils_default.isPlainObject(transitional2)) {
        if (utils_default.hasOwnProp(transitional2, prop)) {
          return transitional2[prop];
        }
      } else {
        return void 0;
      }
    }
    const transitional1 = utils_default.hasOwnProp(config1, "transitional") ? config1.transitional : void 0;
    if (utils_default.isPlainObject(transitional1) && utils_default.hasOwnProp(transitional1, prop)) {
      return transitional1[prop];
    }
    return void 0;
  }
  function mergeDirectKeys(a, b, prop) {
    if (utils_default.hasOwnProp(config2, prop)) {
      return getMergedValue(a, b);
    } else if (utils_default.hasOwnProp(config1, prop)) {
      return getMergedValue(void 0, a);
    }
  }
  const mergeMap = {
    url: valueFromConfig2,
    method: valueFromConfig2,
    data: valueFromConfig2,
    baseURL: defaultToConfig2,
    transformRequest: defaultToConfig2,
    transformResponse: defaultToConfig2,
    paramsSerializer: defaultToConfig2,
    timeout: defaultToConfig2,
    timeoutMessage: defaultToConfig2,
    withCredentials: defaultToConfig2,
    withXSRFToken: defaultToConfig2,
    adapter: defaultToConfig2,
    responseType: defaultToConfig2,
    xsrfCookieName: defaultToConfig2,
    xsrfHeaderName: defaultToConfig2,
    onUploadProgress: defaultToConfig2,
    onDownloadProgress: defaultToConfig2,
    decompress: defaultToConfig2,
    maxContentLength: defaultToConfig2,
    maxBodyLength: defaultToConfig2,
    beforeRedirect: defaultToConfig2,
    transport: defaultToConfig2,
    httpAgent: defaultToConfig2,
    httpsAgent: defaultToConfig2,
    cancelToken: defaultToConfig2,
    socketPath: defaultToConfig2,
    allowedSocketPaths: defaultToConfig2,
    responseEncoding: defaultToConfig2,
    validateStatus: mergeDirectKeys,
    headers: (a, b, prop) => mergeDeepProperties(headersToObject(a), headersToObject(b), prop, true)
  };
  utils_default.forEach(ownEnumerableKeys({ ...config1, ...config2 }), function computeConfigValue(prop) {
    if (prop === "__proto__" || prop === "constructor" || prop === "prototype") return;
    const merge2 = utils_default.hasOwnProp(mergeMap, prop) ? mergeMap[prop] : mergeDeepProperties;
    const a = utils_default.hasOwnProp(config1, prop) ? config1[prop] : void 0;
    const b = utils_default.hasOwnProp(config2, prop) ? config2[prop] : void 0;
    const configValue = merge2(a, b, prop);
    utils_default.isUndefined(configValue) && merge2 !== mergeDirectKeys || (config3[prop] = configValue);
  });
  if (utils_default.hasOwnProp(config2, "validateStatus") && utils_default.isUndefined(config2.validateStatus) && getMergedTransitionalOption("validateStatusUndefinedResolves") === false) {
    if (utils_default.hasOwnProp(config1, "validateStatus")) {
      config3.validateStatus = getMergedValue(void 0, config1.validateStatus);
    } else {
      delete config3.validateStatus;
    }
  }
  return config3;
}

// adapters/node_modules/axios/lib/helpers/resolveConfig.js
var encodeUTF8 = (str) => encodeURIComponent(str).replace(
  /%([0-9A-F]{2})/gi,
  (_, hex) => String.fromCharCode(parseInt(hex, 16))
);
function resolveConfig(config2) {
  const newConfig = mergeConfig({}, config2);
  const own2 = (key) => utils_default.hasOwnProp(newConfig, key) ? newConfig[key] : void 0;
  const data = own2("data");
  let withXSRFToken = own2("withXSRFToken");
  const xsrfHeaderName = own2("xsrfHeaderName");
  const xsrfCookieName = own2("xsrfCookieName");
  let headers = own2("headers");
  const auth = own2("auth");
  const baseURL = own2("baseURL");
  const allowAbsoluteUrls = own2("allowAbsoluteUrls");
  const url2 = own2("url");
  newConfig.headers = headers = AxiosHeaders_default.from(headers);
  newConfig.url = buildURL(
    buildFullPath(baseURL, url2, allowAbsoluteUrls, newConfig),
    own2("params"),
    own2("paramsSerializer")
  );
  if (auth) {
    const username = utils_default.getSafeProp(auth, "username") || "";
    const password = utils_default.getSafeProp(auth, "password") || "";
    try {
      headers.set(
        "Authorization",
        "Basic " + btoa(username + ":" + (password ? encodeUTF8(password) : ""))
      );
    } catch (e) {
      throw AxiosError_default.from(e, AxiosError_default.ERR_BAD_OPTION_VALUE, config2);
    }
  }
  if (utils_default.isFormData(data)) {
    if (platform_default.hasStandardBrowserEnv || platform_default.hasStandardBrowserWebWorkerEnv || utils_default.isReactNative(data)) {
      headers.setContentType(void 0);
    } else if (utils_default.isFunction(data.getHeaders)) {
      setFormDataHeaders(headers, data.getHeaders(), own2("formDataHeaderPolicy"));
    }
  }
  if (platform_default.hasStandardBrowserEnv) {
    if (utils_default.isFunction(withXSRFToken)) {
      withXSRFToken = withXSRFToken(newConfig);
    }
    const shouldSendXSRF = withXSRFToken === true || withXSRFToken == null && isURLSameOrigin_default(newConfig.url);
    if (shouldSendXSRF) {
      const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies_default.read(xsrfCookieName);
      if (xsrfValue) {
        headers.set(xsrfHeaderName, xsrfValue);
      }
    }
  }
  return newConfig;
}
var resolveConfig_default = resolveConfig;

// adapters/node_modules/axios/lib/adapters/xhr.js
var isXHRAdapterSupported = typeof XMLHttpRequest !== "undefined";
var xhr_default = isXHRAdapterSupported && function(config2) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    const _config = resolveConfig_default(config2);
    let requestData = _config.data;
    const requestHeaders = AxiosHeaders_default.from(_config.headers).normalize();
    let { responseType, onUploadProgress, onDownloadProgress } = _config;
    let onCanceled;
    let uploadThrottled, downloadThrottled;
    let flushUpload, flushDownload;
    function done() {
      flushUpload && flushUpload();
      flushDownload && flushDownload();
      _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);
      _config.signal && _config.signal.removeEventListener("abort", onCanceled);
    }
    let request = new XMLHttpRequest();
    request.open(_config.method.toUpperCase(), _config.url, true);
    request.timeout = _config.timeout;
    function onloadend() {
      if (!request) {
        return;
      }
      const responseHeaders = AxiosHeaders_default.from(
        "getAllResponseHeaders" in request && request.getAllResponseHeaders()
      );
      const responseData = !responseType || responseType === "text" || responseType === "json" ? request.responseText : request.response;
      const response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config2,
        request
      };
      settle(
        function _resolve(value) {
          resolve(value);
          done();
        },
        function _reject(err) {
          reject(err);
          done();
        },
        response
      );
      request = null;
    }
    if ("onloadend" in request) {
      request.onloadend = onloadend;
    } else {
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }
        if (request.status === 0 && !(request.responseURL && request.responseURL.startsWith("file:"))) {
          return;
        }
        setTimeout(onloadend);
      };
    }
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }
      reject(new AxiosError_default("Request aborted", AxiosError_default.ECONNABORTED, config2, request));
      done();
      request = null;
    };
    request.onerror = function handleError(event) {
      const msg = event && event.message ? event.message : "Network Error";
      const err = new AxiosError_default(msg, AxiosError_default.ERR_NETWORK, config2, request);
      err.event = event || null;
      reject(err);
      done();
      request = null;
    };
    request.ontimeout = function handleTimeout() {
      let timeoutErrorMessage = _config.timeout ? "timeout of " + _config.timeout + "ms exceeded" : "timeout exceeded";
      const transitional2 = _config.transitional || transitional_default;
      if (_config.timeoutErrorMessage) {
        timeoutErrorMessage = _config.timeoutErrorMessage;
      }
      reject(
        new AxiosError_default(
          timeoutErrorMessage,
          transitional2.clarifyTimeoutError ? AxiosError_default.ETIMEDOUT : AxiosError_default.ECONNABORTED,
          config2,
          request
        )
      );
      done();
      request = null;
    };
    requestData === void 0 && requestHeaders.setContentType(null);
    if ("setRequestHeader" in request) {
      utils_default.forEach(toByteStringHeaderObject(requestHeaders), function setRequestHeader(val, key) {
        request.setRequestHeader(key, val);
      });
    }
    if (!utils_default.isUndefined(_config.withCredentials)) {
      request.withCredentials = !!_config.withCredentials;
    }
    if (responseType && responseType !== "json") {
      request.responseType = _config.responseType;
    }
    if (onDownloadProgress) {
      [downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true);
      request.addEventListener("progress", downloadThrottled);
    }
    if (onUploadProgress && request.upload) {
      [uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress);
      request.upload.addEventListener("progress", uploadThrottled);
      request.upload.addEventListener("loadend", flushUpload);
    }
    if (_config.cancelToken || _config.signal) {
      onCanceled = (cancel) => {
        if (!request) {
          return;
        }
        reject(!cancel || cancel.type ? new CanceledError_default(null, config2, request) : cancel);
        request.abort();
        done();
        request = null;
      };
      _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
      if (_config.signal) {
        _config.signal.aborted ? onCanceled() : _config.signal.addEventListener("abort", onCanceled);
      }
    }
    const protocol = parseProtocol(_config.url);
    if (protocol && !platform_default.protocols.includes(protocol)) {
      reject(
        new AxiosError_default(
          "Unsupported protocol " + protocol + ":",
          AxiosError_default.ERR_BAD_REQUEST,
          config2
        )
      );
      done();
      return;
    }
    request.send(requestData || null);
  });
};

// adapters/node_modules/axios/lib/adapters/fetch.js
init_define_MACRO();

// adapters/node_modules/axios/lib/helpers/composeSignals.js
init_define_MACRO();
var composeSignals = (signals, timeout) => {
  signals = signals ? signals.filter(Boolean) : [];
  if (!timeout && !signals.length) {
    return;
  }
  const controller = new AbortController();
  let aborted = false;
  const onabort = function(reason) {
    if (!aborted) {
      aborted = true;
      unsubscribe();
      const err = reason instanceof Error ? reason : this.reason;
      controller.abort(
        err instanceof AxiosError_default ? err : new CanceledError_default(err instanceof Error ? err.message : err)
      );
    }
  };
  let timer = timeout && setTimeout(() => {
    timer = null;
    onabort(new AxiosError_default(`timeout of ${timeout}ms exceeded`, AxiosError_default.ETIMEDOUT));
  }, timeout);
  const unsubscribe = () => {
    if (!signals) {
      return;
    }
    timer && clearTimeout(timer);
    timer = null;
    signals.forEach((signal2) => {
      signal2.unsubscribe ? signal2.unsubscribe(onabort) : signal2.removeEventListener("abort", onabort);
    });
    signals = null;
  };
  signals.forEach((signal2) => {
    if (aborted) {
      return;
    }
    if (signal2.aborted) {
      onabort.call(signal2);
      return;
    }
    signal2.addEventListener("abort", onabort, { once: true });
  });
  const { signal } = controller;
  signal.unsubscribe = () => utils_default.asap(unsubscribe);
  return signal;
};
var composeSignals_default = composeSignals;

// adapters/node_modules/axios/lib/helpers/trackStream.js
init_define_MACRO();
var streamChunk = function* (chunk, chunkSize) {
  let len = chunk.byteLength;
  if (!chunkSize || len < chunkSize) {
    yield chunk;
    return;
  }
  let pos = 0;
  let end;
  while (pos < len) {
    end = pos + chunkSize;
    yield chunk.slice(pos, end);
    pos = end;
  }
};
var readBytes = async function* (iterable, chunkSize) {
  for await (const chunk of readStream(iterable)) {
    yield* streamChunk(chunk, chunkSize);
  }
};
var readStream = async function* (stream4) {
  if (stream4[Symbol.asyncIterator]) {
    yield* stream4;
    return;
  }
  const reader = stream4.getReader();
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      yield value;
    }
  } finally {
    await reader.cancel();
  }
};
var trackStream = (stream4, chunkSize, onProgress, onFinish) => {
  const iterator2 = readBytes(stream4, chunkSize);
  let bytes = 0;
  let done;
  let _onFinish = (e) => {
    if (!done) {
      done = true;
      onFinish && onFinish(e);
    }
  };
  return new ReadableStream(
    {
      async pull(controller) {
        try {
          const { done: done2, value } = await iterator2.next();
          if (done2) {
            _onFinish();
            controller.close();
            return;
          }
          let len = value.byteLength;
          if (onProgress) {
            let loadedBytes = bytes += len;
            onProgress(loadedBytes);
          }
          controller.enqueue(new Uint8Array(value));
        } catch (err) {
          _onFinish(err);
          throw err;
        }
      },
      cancel(reason) {
        _onFinish(reason);
        return iterator2.return();
      }
    },
    {
      highWaterMark: 2
    }
  );
};

// adapters/node_modules/axios/lib/adapters/fetch.js
var DEFAULT_CHUNK_SIZE = 64 * 1024;
var { isFunction: isFunction2 } = utils_default;
var encodeUTF82 = (str) => encodeURIComponent(str).replace(
  /%([0-9A-F]{2})/gi,
  (_, hex) => String.fromCharCode(parseInt(hex, 16))
);
var decodeURIComponentSafe2 = (value) => {
  if (!utils_default.isString(value)) {
    return value;
  }
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
};
var test = (fn, ...args) => {
  try {
    return !!fn(...args);
  } catch (e) {
    return false;
  }
};
var maybeWithAuthCredentials = (url2) => {
  const protocolIndex = url2.indexOf("://");
  let urlToCheck = url2;
  if (protocolIndex !== -1) {
    urlToCheck = urlToCheck.slice(protocolIndex + 3);
  }
  return urlToCheck.includes("@") || urlToCheck.includes(":");
};
var factory = (env) => {
  const globalObject = utils_default.global !== void 0 && utils_default.global !== null ? utils_default.global : globalThis;
  const { ReadableStream: ReadableStream2, TextEncoder: TextEncoder2 } = globalObject;
  env = utils_default.merge.call(
    {
      skipUndefined: true
    },
    {
      Request: globalObject.Request,
      Response: globalObject.Response
    },
    env
  );
  const { fetch: envFetch, Request, Response } = env;
  const isFetchSupported = envFetch ? isFunction2(envFetch) : typeof fetch === "function";
  const isRequestSupported = isFunction2(Request);
  const isResponseSupported = isFunction2(Response);
  if (!isFetchSupported) {
    return false;
  }
  const isReadableStreamSupported = isFetchSupported && isFunction2(ReadableStream2);
  const encodeText = isFetchSupported && (typeof TextEncoder2 === "function" ? /* @__PURE__ */ ((encoder) => (str) => encoder.encode(str))(new TextEncoder2()) : async (str) => new Uint8Array(await new Request(str).arrayBuffer()));
  const supportsRequestStream = isRequestSupported && isReadableStreamSupported && test(() => {
    let duplexAccessed = false;
    const request = new Request(platform_default.origin, {
      body: new ReadableStream2(),
      method: "POST",
      get duplex() {
        duplexAccessed = true;
        return "half";
      }
    });
    const hasContentType = request.headers.has("Content-Type");
    if (request.body != null) {
      request.body.cancel();
    }
    return duplexAccessed && !hasContentType;
  });
  const supportsResponseStream = isResponseSupported && isReadableStreamSupported && test(() => utils_default.isReadableStream(new Response("").body));
  const resolvers = {
    stream: supportsResponseStream && ((res) => res.body)
  };
  isFetchSupported && (() => {
    ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((type) => {
      !resolvers[type] && (resolvers[type] = (res, config2) => {
        let method = res && res[type];
        if (method) {
          return method.call(res);
        }
        throw new AxiosError_default(
          `Response type '${type}' is not supported`,
          AxiosError_default.ERR_NOT_SUPPORT,
          config2
        );
      });
    });
  })();
  const getBodyLength = async (body) => {
    if (body == null) {
      return 0;
    }
    if (utils_default.isBlob(body)) {
      return body.size;
    }
    if (utils_default.isSpecCompliantForm(body)) {
      const _request = new Request(platform_default.origin, {
        method: "POST",
        body
      });
      return (await _request.arrayBuffer()).byteLength;
    }
    if (utils_default.isArrayBufferView(body) || utils_default.isArrayBuffer(body)) {
      return body.byteLength;
    }
    if (utils_default.isURLSearchParams(body)) {
      body = body + "";
    }
    if (utils_default.isString(body)) {
      return (await encodeText(body)).byteLength;
    }
  };
  const resolveBodyLength = async (headers, body) => {
    const length = utils_default.toFiniteNumber(headers.getContentLength());
    return length == null ? getBodyLength(body) : length;
  };
  return async (config2) => {
    let {
      url: url2,
      method,
      data,
      signal,
      cancelToken,
      timeout,
      onDownloadProgress,
      onUploadProgress,
      responseType,
      headers,
      withCredentials = "same-origin",
      fetchOptions,
      maxContentLength,
      maxBodyLength
    } = resolveConfig_default(config2);
    const hasMaxContentLength = utils_default.isNumber(maxContentLength) && maxContentLength > -1;
    const hasMaxBodyLength = utils_default.isNumber(maxBodyLength) && maxBodyLength > -1;
    const own2 = (key) => utils_default.hasOwnProp(config2, key) ? config2[key] : void 0;
    let _fetch = envFetch || fetch;
    responseType = responseType ? (responseType + "").toLowerCase() : "text";
    let composedSignal = composeSignals_default(
      [signal, cancelToken && cancelToken.toAbortSignal()],
      timeout
    );
    let request = null;
    const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
      composedSignal.unsubscribe();
    });
    let requestContentLength;
    let pendingBodyError = null;
    const maxBodyLengthError = () => new AxiosError_default(
      "Request body larger than maxBodyLength limit",
      AxiosError_default.ERR_BAD_REQUEST,
      config2,
      request
    );
    try {
      let auth = void 0;
      const configAuth = own2("auth");
      if (configAuth) {
        const username = utils_default.getSafeProp(configAuth, "username") || "";
        const password = utils_default.getSafeProp(configAuth, "password") || "";
        auth = {
          username,
          password
        };
      }
      if (maybeWithAuthCredentials(url2)) {
        const parsedURL = new URL(url2, platform_default.origin);
        if (!auth && (parsedURL.username || parsedURL.password)) {
          const urlUsername = decodeURIComponentSafe2(parsedURL.username);
          const urlPassword = decodeURIComponentSafe2(parsedURL.password);
          auth = {
            username: urlUsername,
            password: urlPassword
          };
        }
        if (parsedURL.username || parsedURL.password) {
          parsedURL.username = "";
          parsedURL.password = "";
          url2 = parsedURL.href;
        }
      }
      if (auth) {
        headers.delete("authorization");
        headers.set(
          "Authorization",
          "Basic " + btoa(encodeUTF82((auth.username || "") + ":" + (auth.password || "")))
        );
      }
      if (hasMaxContentLength && typeof url2 === "string" && url2.startsWith("data:")) {
        const estimated = estimateDataURLDecodedBytes(url2);
        if (estimated > maxContentLength) {
          throw new AxiosError_default(
            "maxContentLength size of " + maxContentLength + " exceeded",
            AxiosError_default.ERR_BAD_RESPONSE,
            config2,
            request
          );
        }
      }
      if (hasMaxBodyLength && method !== "get" && method !== "head") {
        const outboundLength = await getBodyLength(data);
        if (typeof outboundLength === "number" && isFinite(outboundLength)) {
          requestContentLength = outboundLength;
          if (outboundLength > maxBodyLength) {
            throw maxBodyLengthError();
          }
        }
      }
      const mustEnforceStreamBody = hasMaxBodyLength && (utils_default.isReadableStream(data) || utils_default.isStream(data));
      const trackRequestStream = (stream4, onProgress, flush) => trackStream(
        stream4,
        DEFAULT_CHUNK_SIZE,
        (loadedBytes) => {
          if (hasMaxBodyLength && loadedBytes > maxBodyLength) {
            throw pendingBodyError = maxBodyLengthError();
          }
          onProgress && onProgress(loadedBytes);
        },
        flush
      );
      if (supportsRequestStream && method !== "get" && method !== "head" && (onUploadProgress || mustEnforceStreamBody)) {
        requestContentLength = requestContentLength == null ? await resolveBodyLength(headers, data) : requestContentLength;
        if (requestContentLength !== 0 || mustEnforceStreamBody) {
          let _request = new Request(url2, {
            method: "POST",
            body: data,
            duplex: "half"
          });
          let contentTypeHeader;
          if (utils_default.isFormData(data) && (contentTypeHeader = _request.headers.get("content-type"))) {
            headers.setContentType(contentTypeHeader);
          }
          if (_request.body) {
            const [onProgress, flush] = onUploadProgress && progressEventDecorator(
              requestContentLength,
              progressEventReducer(asyncDecorator(onUploadProgress))
            ) || [];
            data = trackRequestStream(_request.body, onProgress, flush);
          }
        }
      } else if (mustEnforceStreamBody && !isRequestSupported && isReadableStreamSupported && method !== "get" && method !== "head") {
        data = trackRequestStream(data);
      } else if (mustEnforceStreamBody && isRequestSupported && !supportsRequestStream && method !== "get" && method !== "head") {
        throw new AxiosError_default(
          "Stream request bodies are not supported by the current fetch implementation",
          AxiosError_default.ERR_NOT_SUPPORT,
          config2,
          request
        );
      }
      if (!utils_default.isString(withCredentials)) {
        withCredentials = withCredentials ? "include" : "omit";
      }
      const isCredentialsSupported = isRequestSupported && "credentials" in Request.prototype;
      if (utils_default.isFormData(data)) {
        const contentType = headers.getContentType();
        if (contentType && /^multipart\/form-data/i.test(contentType) && !/boundary=/i.test(contentType)) {
          headers.delete("content-type");
        }
      }
      headers.set("User-Agent", "axios/" + VERSION, false);
      const resolvedOptions = {
        ...fetchOptions,
        signal: composedSignal,
        method: method.toUpperCase(),
        headers: toByteStringHeaderObject(headers.normalize()),
        body: data,
        duplex: "half",
        credentials: isCredentialsSupported ? withCredentials : void 0
      };
      request = isRequestSupported && new Request(url2, resolvedOptions);
      let response = await (isRequestSupported ? _fetch(request, fetchOptions) : _fetch(url2, resolvedOptions));
      const responseHeaders = AxiosHeaders_default.from(response.headers);
      if (hasMaxContentLength) {
        const declaredLength = utils_default.toFiniteNumber(responseHeaders.getContentLength());
        if (declaredLength != null && declaredLength > maxContentLength) {
          throw new AxiosError_default(
            "maxContentLength size of " + maxContentLength + " exceeded",
            AxiosError_default.ERR_BAD_RESPONSE,
            config2,
            request
          );
        }
      }
      const isStreamResponse = supportsResponseStream && (responseType === "stream" || responseType === "response");
      if (supportsResponseStream && response.body && (onDownloadProgress || hasMaxContentLength || isStreamResponse && unsubscribe)) {
        const options = {};
        ["status", "statusText", "headers"].forEach((prop) => {
          options[prop] = response[prop];
        });
        const responseContentLength = utils_default.toFiniteNumber(responseHeaders.getContentLength());
        const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
          responseContentLength,
          progressEventReducer(asyncDecorator(onDownloadProgress), true)
        ) || [];
        let bytesRead = 0;
        const onChunkProgress = (loadedBytes) => {
          if (hasMaxContentLength) {
            bytesRead = loadedBytes;
            if (bytesRead > maxContentLength) {
              throw new AxiosError_default(
                "maxContentLength size of " + maxContentLength + " exceeded",
                AxiosError_default.ERR_BAD_RESPONSE,
                config2,
                request
              );
            }
          }
          onProgress && onProgress(loadedBytes);
        };
        response = new Response(
          trackStream(response.body, DEFAULT_CHUNK_SIZE, onChunkProgress, () => {
            flush && flush();
            unsubscribe && unsubscribe();
          }),
          options
        );
      }
      responseType = responseType || "text";
      let responseData = await resolvers[utils_default.findKey(resolvers, responseType) || "text"](
        response,
        config2
      );
      if (hasMaxContentLength && !supportsResponseStream && !isStreamResponse) {
        let materializedSize;
        if (responseData != null) {
          if (typeof responseData.byteLength === "number") {
            materializedSize = responseData.byteLength;
          } else if (typeof responseData.size === "number") {
            materializedSize = responseData.size;
          } else if (typeof responseData === "string") {
            materializedSize = typeof TextEncoder2 === "function" ? new TextEncoder2().encode(responseData).byteLength : responseData.length;
          }
        }
        if (typeof materializedSize === "number" && materializedSize > maxContentLength) {
          throw new AxiosError_default(
            "maxContentLength size of " + maxContentLength + " exceeded",
            AxiosError_default.ERR_BAD_RESPONSE,
            config2,
            request
          );
        }
      }
      !isStreamResponse && unsubscribe && unsubscribe();
      return await new Promise((resolve, reject) => {
        settle(resolve, reject, {
          data: responseData,
          headers: AxiosHeaders_default.from(response.headers),
          status: response.status,
          statusText: response.statusText,
          config: config2,
          request
        });
      });
    } catch (err) {
      unsubscribe && unsubscribe();
      if (composedSignal && composedSignal.aborted && composedSignal.reason instanceof AxiosError_default) {
        const canceledError = composedSignal.reason;
        canceledError.config = config2;
        request && (canceledError.request = request);
        if (err !== canceledError) {
          Object.defineProperty(canceledError, "cause", {
            __proto__: null,
            value: err,
            writable: true,
            enumerable: false,
            configurable: true
          });
        }
        throw canceledError;
      }
      if (pendingBodyError) {
        request && !pendingBodyError.request && (pendingBodyError.request = request);
        throw pendingBodyError;
      }
      if (err instanceof AxiosError_default) {
        request && !err.request && (err.request = request);
        throw err;
      }
      if (err && err.name === "TypeError" && /Load failed|fetch/i.test(err.message)) {
        const networkError = new AxiosError_default(
          "Network Error",
          AxiosError_default.ERR_NETWORK,
          config2,
          request,
          err && err.response
        );
        Object.defineProperty(networkError, "cause", {
          __proto__: null,
          value: err.cause || err,
          writable: true,
          enumerable: false,
          configurable: true
        });
        throw networkError;
      }
      throw AxiosError_default.from(err, err && err.code, config2, request, err && err.response);
    }
  };
};
var seedCache = /* @__PURE__ */ new Map();
var getFetch = (config2) => {
  let env = config2 && config2.env || {};
  const { fetch: fetch2, Request, Response } = env;
  const seeds = [Request, Response, fetch2];
  let len = seeds.length, i = len, seed, target, map = seedCache;
  while (i--) {
    seed = seeds[i];
    target = map.get(seed);
    target === void 0 && map.set(seed, target = i ? /* @__PURE__ */ new Map() : factory(env));
    map = target;
  }
  return target;
};
var adapter = getFetch();

// adapters/node_modules/axios/lib/adapters/adapters.js
var knownAdapters = {
  http: http_default,
  xhr: xhr_default,
  fetch: {
    get: getFetch
  }
};
utils_default.forEach(knownAdapters, (fn, value) => {
  if (fn) {
    try {
      Object.defineProperty(fn, "name", { __proto__: null, value });
    } catch (e) {
    }
    Object.defineProperty(fn, "adapterName", { __proto__: null, value });
  }
});
var renderReason = (reason) => `- ${reason}`;
var isResolvedHandle = (adapter2) => utils_default.isFunction(adapter2) || adapter2 === null || adapter2 === false;
function getAdapter(adapters, config2) {
  adapters = utils_default.isArray(adapters) ? adapters : [adapters];
  const { length } = adapters;
  let nameOrAdapter;
  let adapter2;
  const rejectedReasons = {};
  for (let i = 0; i < length; i++) {
    nameOrAdapter = adapters[i];
    let id;
    adapter2 = nameOrAdapter;
    if (!isResolvedHandle(nameOrAdapter)) {
      adapter2 = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];
      if (adapter2 === void 0) {
        throw new AxiosError_default(`Unknown adapter '${id}'`);
      }
    }
    if (adapter2 && (utils_default.isFunction(adapter2) || (adapter2 = adapter2.get(config2)))) {
      break;
    }
    rejectedReasons[id || "#" + i] = adapter2;
  }
  if (!adapter2) {
    const reasons = Object.entries(rejectedReasons).map(
      ([id, state]) => `adapter ${id} ` + (state === false ? "is not supported by the environment" : "is not available in the build")
    );
    let s = length ? reasons.length > 1 ? "since :\n" + reasons.map(renderReason).join("\n") : " " + renderReason(reasons[0]) : "as no adapter specified";
    throw new AxiosError_default(
      `There is no suitable adapter to dispatch the request ` + s,
      AxiosError_default.ERR_NOT_SUPPORT
    );
  }
  return adapter2;
}
var adapters_default = {
  /**
   * Resolve an adapter from a list of adapter names or functions.
   * @type {Function}
   */
  getAdapter,
  /**
   * Exposes all known adapters
   * @type {Object<string, Function|Object>}
   */
  adapters: knownAdapters
};

// adapters/node_modules/axios/lib/core/dispatchRequest.js
function throwIfCancellationRequested(config2) {
  if (config2.cancelToken) {
    config2.cancelToken.throwIfRequested();
  }
  if (config2.signal && config2.signal.aborted) {
    throw new CanceledError_default(null, config2);
  }
}
function dispatchRequest(config2) {
  throwIfCancellationRequested(config2);
  config2.headers = AxiosHeaders_default.from(config2.headers);
  config2.data = transformData.call(config2, config2.transformRequest);
  if (["post", "put", "patch"].indexOf(config2.method) !== -1) {
    config2.headers.setContentType("application/x-www-form-urlencoded", false);
  }
  const adapter2 = adapters_default.getAdapter(config2.adapter || defaults_default.adapter, config2);
  return adapter2(config2).then(
    function onAdapterResolution(response) {
      throwIfCancellationRequested(config2);
      config2.response = response;
      try {
        response.data = transformData.call(config2, config2.transformResponse, response);
      } finally {
        delete config2.response;
      }
      response.headers = AxiosHeaders_default.from(response.headers);
      return response;
    },
    function onAdapterRejection(reason) {
      if (!isCancel(reason)) {
        throwIfCancellationRequested(config2);
        if (reason && reason.response) {
          config2.response = reason.response;
          try {
            reason.response.data = transformData.call(
              config2,
              config2.transformResponse,
              reason.response
            );
          } finally {
            delete config2.response;
          }
          reason.response.headers = AxiosHeaders_default.from(reason.response.headers);
        }
      }
      return Promise.reject(reason);
    }
  );
}

// adapters/node_modules/axios/lib/helpers/validator.js
init_define_MACRO();
var validators = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((type, i) => {
  validators[type] = function validator(thing) {
    return typeof thing === type || "a" + (i < 1 ? "n " : " ") + type;
  };
});
var deprecatedWarnings = {};
validators.transitional = function transitional(validator, version, message) {
  function formatMessage(opt, desc) {
    return "[Axios v" + VERSION + "] Transitional option '" + opt + "'" + desc + (message ? ". " + message : "");
  }
  return (value, opt, opts) => {
    if (validator === false) {
      throw new AxiosError_default(
        formatMessage(opt, " has been removed" + (version ? " in " + version : "")),
        AxiosError_default.ERR_DEPRECATED
      );
    }
    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      console.warn(
        formatMessage(
          opt,
          " has been deprecated since v" + version + " and will be removed in the near future"
        )
      );
    }
    return validator ? validator(value, opt, opts) : true;
  };
};
validators.spelling = function spelling(correctSpelling) {
  return (value, opt) => {
    console.warn(`${opt} is likely a misspelling of ${correctSpelling}`);
    return true;
  };
};
function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== "object" || options === null) {
    throw new AxiosError_default("options must be an object", AxiosError_default.ERR_BAD_OPTION_VALUE);
  }
  const keys = Object.keys(options);
  let i = keys.length;
  while (i-- > 0) {
    const opt = keys[i];
    const validator = Object.prototype.hasOwnProperty.call(schema, opt) ? schema[opt] : void 0;
    if (validator) {
      const value = options[opt];
      const result = value === void 0 || validator(value, opt, options);
      if (result !== true) {
        throw new AxiosError_default(
          "option " + opt + " must be " + result,
          AxiosError_default.ERR_BAD_OPTION_VALUE
        );
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError_default("Unknown option " + opt, AxiosError_default.ERR_BAD_OPTION);
    }
  }
}
var validator_default = {
  assertOptions,
  validators
};

// adapters/node_modules/axios/lib/core/Axios.js
var validators2 = validator_default.validators;
var Axios = class {
  constructor(instanceConfig) {
    this.defaults = instanceConfig || {};
    this.interceptors = {
      request: new InterceptorManager_default(),
      response: new InterceptorManager_default()
    };
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(configOrUrl, config2) {
    try {
      return await this._request(configOrUrl, config2);
    } catch (err) {
      if (err instanceof Error) {
        let dummy = {};
        Error.captureStackTrace ? Error.captureStackTrace(dummy) : dummy = new Error();
        const stack = (() => {
          if (!dummy.stack) {
            return "";
          }
          const firstNewlineIndex = dummy.stack.indexOf("\n");
          return firstNewlineIndex === -1 ? "" : dummy.stack.slice(firstNewlineIndex + 1);
        })();
        try {
          if (!err.stack) {
            err.stack = stack;
          } else if (stack) {
            const firstNewlineIndex = stack.indexOf("\n");
            const secondNewlineIndex = firstNewlineIndex === -1 ? -1 : stack.indexOf("\n", firstNewlineIndex + 1);
            const stackWithoutTwoTopLines = secondNewlineIndex === -1 ? "" : stack.slice(secondNewlineIndex + 1);
            if (!String(err.stack).endsWith(stackWithoutTwoTopLines)) {
              err.stack += "\n" + stack;
            }
          }
        } catch (e) {
        }
      }
      throw err;
    }
  }
  _request(configOrUrl, config2) {
    if (typeof configOrUrl === "string") {
      config2 = config2 || {};
      config2.url = configOrUrl;
    } else {
      config2 = configOrUrl || {};
    }
    config2 = mergeConfig(this.defaults, config2);
    const { transitional: transitional2, paramsSerializer, headers } = config2;
    if (transitional2 !== void 0) {
      validator_default.assertOptions(
        transitional2,
        {
          silentJSONParsing: validators2.transitional(validators2.boolean),
          forcedJSONParsing: validators2.transitional(validators2.boolean),
          clarifyTimeoutError: validators2.transitional(validators2.boolean),
          legacyInterceptorReqResOrdering: validators2.transitional(validators2.boolean),
          advertiseZstdAcceptEncoding: validators2.transitional(validators2.boolean),
          validateStatusUndefinedResolves: validators2.transitional(validators2.boolean)
        },
        false
      );
    }
    if (paramsSerializer != null) {
      if (utils_default.isFunction(paramsSerializer)) {
        config2.paramsSerializer = {
          serialize: paramsSerializer
        };
      } else {
        validator_default.assertOptions(
          paramsSerializer,
          {
            encode: validators2.function,
            serialize: validators2.function
          },
          true
        );
      }
    }
    if (config2.allowAbsoluteUrls !== void 0) {
    } else if (this.defaults.allowAbsoluteUrls !== void 0) {
      config2.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
    } else {
      config2.allowAbsoluteUrls = true;
    }
    validator_default.assertOptions(
      config2,
      {
        baseUrl: validators2.spelling("baseURL"),
        withXsrfToken: validators2.spelling("withXSRFToken")
      },
      true
    );
    config2.method = (config2.method || this.defaults.method || "get").toLowerCase();
    let contextHeaders = headers && utils_default.merge(headers.common, headers[config2.method]);
    headers && utils_default.forEach(["delete", "get", "head", "post", "put", "patch", "query", "common"], (method) => {
      delete headers[method];
    });
    config2.headers = AxiosHeaders_default.concat(contextHeaders, headers);
    const requestInterceptorChain = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === "function" && interceptor.runWhen(config2) === false) {
        return;
      }
      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
      const transitional3 = config2.transitional || transitional_default;
      const legacyInterceptorReqResOrdering = transitional3 && transitional3.legacyInterceptorReqResOrdering;
      if (legacyInterceptorReqResOrdering) {
        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
      } else {
        requestInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
      }
    });
    const responseInterceptorChain = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });
    let promise;
    let i = 0;
    let len;
    if (!synchronousRequestInterceptors) {
      const chain = [dispatchRequest.bind(this), void 0];
      chain.unshift(...requestInterceptorChain);
      chain.push(...responseInterceptorChain);
      len = chain.length;
      promise = Promise.resolve(config2);
      while (i < len) {
        promise = promise.then(chain[i++], chain[i++]);
      }
      return promise;
    }
    len = requestInterceptorChain.length;
    let newConfig = config2;
    while (i < len) {
      const onFulfilled = requestInterceptorChain[i++];
      const onRejected = requestInterceptorChain[i++];
      try {
        newConfig = onFulfilled ? onFulfilled(newConfig) : newConfig;
      } catch (error) {
        if (!onRejected) {
          promise = Promise.reject(error);
          break;
        }
        try {
          const rejectedResult = onRejected.call(this, error);
          if (utils_default.isThenable(rejectedResult)) {
            promise = Promise.resolve(rejectedResult).then(
              () => dispatchRequest.call(this, newConfig)
            );
          }
        } catch (rejectedError) {
          promise = Promise.reject(rejectedError);
        }
        break;
      }
    }
    if (!promise) {
      try {
        promise = dispatchRequest.call(this, newConfig);
      } catch (error) {
        promise = Promise.reject(error);
      }
    }
    i = 0;
    len = responseInterceptorChain.length;
    while (i < len) {
      promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
    }
    return promise;
  }
  getUri(config2) {
    config2 = mergeConfig(this.defaults, config2);
    const fullPath = buildFullPath(config2.baseURL, config2.url, config2.allowAbsoluteUrls, config2);
    return buildURL(fullPath, config2.params, config2.paramsSerializer);
  }
};
utils_default.forEach(["delete", "get", "head", "options"], function forEachMethodNoData(method) {
  Axios.prototype[method] = function(url2, config2) {
    return this.request(
      mergeConfig(config2 || {}, {
        method,
        url: url2,
        data: config2 && utils_default.hasOwnProp(config2, "data") ? config2.data : void 0
      })
    );
  };
});
utils_default.forEach(["post", "put", "patch", "query"], function forEachMethodWithData(method) {
  function generateHTTPMethod(isForm) {
    return function httpMethod(url2, data, config2) {
      return this.request(
        mergeConfig(config2 || {}, {
          method,
          headers: isForm ? {
            "Content-Type": "multipart/form-data"
          } : {},
          url: url2,
          data
        })
      );
    };
  }
  Axios.prototype[method] = generateHTTPMethod();
  if (method !== "query") {
    Axios.prototype[method + "Form"] = generateHTTPMethod(true);
  }
});
var Axios_default = Axios;

// adapters/node_modules/axios/lib/cancel/CancelToken.js
init_define_MACRO();
var CancelToken = class _CancelToken {
  constructor(executor) {
    if (typeof executor !== "function") {
      throw new TypeError("executor must be a function.");
    }
    let resolvePromise;
    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });
    const token = this;
    this.promise.then((cancel) => {
      if (!token._listeners) return;
      let i = token._listeners.length;
      while (i-- > 0) {
        token._listeners[i](cancel);
      }
      token._listeners = null;
    });
    this.promise.then = (onfulfilled) => {
      let _resolve;
      const promise = new Promise((resolve) => {
        token.subscribe(resolve);
        _resolve = resolve;
      }).then(onfulfilled);
      promise.cancel = function reject() {
        token.unsubscribe(_resolve);
      };
      return promise;
    };
    executor(function cancel(message, config2, request) {
      if (token.reason) {
        return;
      }
      token.reason = new CanceledError_default(message, config2, request);
      resolvePromise(token.reason);
    });
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(listener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }
    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(listener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }
  toAbortSignal() {
    const controller = new AbortController();
    const abort = (err) => {
      controller.abort(err);
    };
    this.subscribe(abort);
    controller.signal.unsubscribe = () => this.unsubscribe(abort);
    return controller.signal;
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let cancel;
    const token = new _CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token,
      cancel
    };
  }
};
var CancelToken_default = CancelToken;

// adapters/node_modules/axios/lib/helpers/spread.js
init_define_MACRO();
function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
}

// adapters/node_modules/axios/lib/helpers/isAxiosError.js
init_define_MACRO();
function isAxiosError(payload) {
  return utils_default.isObject(payload) && payload.isAxiosError === true;
}

// adapters/node_modules/axios/lib/helpers/HttpStatusCode.js
init_define_MACRO();
var HttpStatusCode = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
  WebServerReturnsAnUnknownError: 520,
  WebServerIsDown: 521,
  ConnectionTimedOut: 522,
  OriginIsUnreachable: 523,
  TimeoutOccurred: 524,
  SslHandshakeFailed: 525,
  InvalidSslCertificate: 526
};
Object.entries(HttpStatusCode).forEach(([key, value]) => {
  HttpStatusCode[value] = key;
});
var HttpStatusCode_default = HttpStatusCode;

// adapters/node_modules/axios/lib/axios.js
function createInstance(defaultConfig2) {
  const context = new Axios_default(defaultConfig2);
  const instance = bind(Axios_default.prototype.request, context);
  utils_default.extend(instance, Axios_default.prototype, context, { allOwnKeys: true });
  utils_default.extend(instance, context, null, { allOwnKeys: true });
  instance.create = function create2(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig2, instanceConfig));
  };
  return instance;
}
var axios = createInstance(defaults_default);
axios.Axios = Axios_default;
axios.CanceledError = CanceledError_default;
axios.CancelToken = CancelToken_default;
axios.isCancel = isCancel;
axios.VERSION = VERSION;
axios.toFormData = toFormData_default;
axios.AxiosError = AxiosError_default;
axios.Cancel = axios.CanceledError;
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = spread;
axios.isAxiosError = isAxiosError;
axios.mergeConfig = mergeConfig;
axios.AxiosHeaders = AxiosHeaders_default;
axios.formToJSON = (thing) => formDataToJSON_default(utils_default.isHTMLForm(thing) ? new FormData(thing) : thing);
axios.getAdapter = adapters_default.getAdapter;
axios.HttpStatusCode = HttpStatusCode_default;
axios.default = axios;
var axios_default = axios;

// adapters/node_modules/axios/index.js
var {
  Axios: Axios2,
  AxiosError: AxiosError2,
  CanceledError: CanceledError2,
  isCancel: isCancel2,
  CancelToken: CancelToken2,
  VERSION: VERSION2,
  all: all2,
  Cancel,
  isAxiosError: isAxiosError2,
  spread: spread2,
  toFormData: toFormData2,
  AxiosHeaders: AxiosHeaders2,
  HttpStatusCode: HttpStatusCode2,
  formToJSON,
  getAdapter: getAdapter2,
  mergeConfig: mergeConfig2,
  create
} = axios_default;

// adapters/node_modules/dingtalk-stream/dist/client.mjs
import EventEmitter2 from "events";
var defaultConfig = {
  autoReconnect: true,
  keepAlive: false,
  ua: "",
  subscriptions: [
    {
      type: "EVENT",
      topic: "*"
    }
  ]
};
var DWClient = class extends EventEmitter2 {
  debug = false;
  connected = false;
  registered = false;
  reconnecting = false;
  userDisconnect = false;
  reconnectInterval = 1e3;
  heartbeat_interval = 8e3;
  heartbeatIntervallId;
  sslopts = { rejectUnauthorized: true };
  config;
  socket;
  dw_url;
  isAlive = false;
  onEventReceived = (msg) => {
    return {
      status: "SUCCESS"
      /* SUCCESS */
    };
  };
  constructor(opts) {
    super();
    this.config = {
      ...defaultConfig,
      ...opts
    };
    if (!this.config.clientId || !this.config.clientSecret) {
      console.error("clientId or clientSecret is null");
      throw new Error("clientId or clientSecret is null");
    }
    if (this.config.debug !== void 0) {
      this.debug = this.config.debug;
    }
  }
  getConfig() {
    return { ...this.config };
  }
  printDebug(msg) {
    if (this.debug) {
      const date = "[" + (/* @__PURE__ */ new Date()).toISOString() + "]";
      console.info(date, msg);
    }
  }
  registerAllEventListener(onEventReceived) {
    this.onEventReceived = onEventReceived;
    return this;
  }
  registerCallbackListener(eventId, callback) {
    if (!eventId || !callback) {
      console.error(
        "registerCallbackListener: eventId and callback must be defined"
      );
      throw new Error(
        "registerCallbackListener: eventId and callback must be defined"
      );
    }
    if (!this.config.subscriptions.find(
      (x) => x.topic === eventId && x.type === "CALLBACK"
    )) {
      this.config.subscriptions.push({
        type: "CALLBACK",
        topic: eventId
      });
    }
    this.on(eventId, callback);
    return this;
  }
  async getAccessToken() {
    const result = await axios_default.get(
      `${GET_TOKEN_URL}?appkey=${this.config.clientId}&appsecret=${this.config.clientSecret}`
    );
    if (result.status === 200 && result.data.access_token) {
      this.config.access_token = result.data.access_token;
      return result.data.access_token;
    } else {
      throw new Error("getAccessToken: get access_token failed");
    }
  }
  async getEndpoint() {
    this.printDebug("get connect endpoint by config");
    this.printDebug(this.config);
    const res = await axios_default({
      url: GATEWAY_URL,
      method: "POST",
      responseType: "json",
      data: {
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        ua: this.config.ua,
        subscriptions: this.config.subscriptions
      },
      headers: {
        // 这个接口得加个，否则默认返回的会是xml
        Accept: "application/json"
      }
    });
    this.printDebug("res.data " + JSON.stringify(res.data));
    if (res.data) {
      this.config.endpoint = res.data;
      const { endpoint, ticket } = res.data;
      if (!endpoint || !ticket) {
        this.printDebug("endpoint or ticket is null");
        throw new Error("endpoint or ticket is null");
      }
      this.dw_url = `${endpoint}?ticket=${ticket}`;
      return this;
    } else {
      throw new Error("build: get endpoint failed");
    }
  }
  _connect() {
    return new Promise((resolve, reject) => {
      this.userDisconnect = false;
      this.printDebug("Connecting to dingtalk websocket @ " + this.dw_url);
      this.socket = new wrapper_default(this.dw_url, this.sslopts);
      this.socket.on("open", () => {
        this.connected = true;
        console.info("[" + (/* @__PURE__ */ new Date()).toISOString() + "] connect success");
        if (this.config.keepAlive) {
          this.isAlive = true;
          this.heartbeatIntervallId = setInterval(() => {
            var _a, _b;
            if (this.isAlive === false) {
              console.error(
                "TERMINATE SOCKET: Ping Pong does not transfer heartbeat within heartbeat intervall"
              );
              return (_a = this.socket) == null ? void 0 : _a.terminate();
            }
            this.isAlive = false;
            (_b = this.socket) == null ? void 0 : _b.ping("", true);
          }, this.heartbeat_interval);
        }
      });
      this.socket.on("pong", () => {
        this.heartbeat();
      });
      this.socket.on("message", (data) => {
        this.onDownStream(data);
      });
      this.socket.on("close", (err) => {
        this.printDebug("Socket closed");
        this.connected = false;
        this.registered = false;
        if (this.config.autoReconnect && !this.userDisconnect) {
          this.reconnecting = true;
          this.printDebug(
            "Reconnecting in " + this.reconnectInterval / 1e3 + " seconds..."
          );
          setTimeout(this.connect.bind(this), this.reconnectInterval);
        }
      });
      this.socket.on("error", (err) => {
        this.printDebug("SOCKET ERROR");
        console.warn("ERROR", err);
      });
      resolve();
    });
  }
  async connect() {
    await this.getEndpoint();
    await this._connect();
  }
  disconnect() {
    var _a;
    console.info("Disconnecting.");
    this.userDisconnect = true;
    if (this.config.keepAlive && this.heartbeatIntervallId !== void 0) {
      clearInterval(this.heartbeatIntervallId);
    }
    (_a = this.socket) == null ? void 0 : _a.close();
  }
  heartbeat() {
    this.isAlive = true;
    this.printDebug("CLIENT-SIDE HEARTBEAT");
  }
  onDownStream(data) {
    this.printDebug("Received message from dingtalk websocket server");
    const msg = JSON.parse(data);
    this.printDebug(msg);
    switch (msg.type) {
      case "SYSTEM":
        this.onSystem(msg);
        break;
      case "EVENT":
        this.onEvent(msg);
        break;
      case "CALLBACK":
        this.onCallback(msg);
        break;
    }
  }
  onSystem(downstream) {
    var _a;
    switch (downstream.headers.topic) {
      case "CONNECTED": {
        this.printDebug("CONNECTED");
        break;
      }
      case "REGISTERED": {
        this.registered = true;
        this.reconnecting = false;
        break;
      }
      case "disconnect": {
        this.connected = false;
        this.registered = false;
        break;
      }
      case "KEEPALIVE": {
        this.heartbeat();
        break;
      }
      case "ping": {
        this.printDebug("PING");
        (_a = this.socket) == null ? void 0 : _a.send(
          JSON.stringify({
            code: 200,
            headers: downstream.headers,
            message: "OK",
            data: downstream.data
          })
        );
        break;
      }
    }
  }
  onEvent(message) {
    var _a;
    this.printDebug("received event, message=" + JSON.stringify(message));
    const ackData = this.onEventReceived(message);
    (_a = this.socket) == null ? void 0 : _a.send(JSON.stringify({
      code: 200,
      headers: {
        contentType: "application/json",
        messageId: message.headers.messageId
      },
      message: "OK",
      data: JSON.stringify(ackData)
    }));
  }
  onCallback(message) {
    this.emit(message.headers.topic, message);
  }
  send(messageId, value) {
    var _a;
    if (!messageId) {
      console.error("send: messageId must be defined");
      throw new Error("send: messageId must be defined");
    }
    const msg = {
      code: 200,
      headers: {
        contentType: "application/json",
        messageId
      },
      message: "OK",
      data: JSON.stringify(value)
    };
    (_a = this.socket) == null ? void 0 : _a.send(JSON.stringify(msg));
  }
  /**
   * 消息响应，避免服务端重试. 
   * stream模式下，服务端推送消息到client后，会监听client响应，如果消息长时间未响应会在一定时间内(60s)重试推消息，可以通过此方法返回消息响应，避免多次接收服务端消息。
   * @param messageId
   * @param result
   * @returns
   * @memberof DWClient
   * @example
   * ```javascript
   * client.socketResponse(res.headers.messageId, result.data);
   * ```
   */
  socketCallBackResponse(messageId, result) {
    this.send(messageId, { response: result });
  }
  sendGraphAPIResponse(messageId, value) {
    var _a;
    if (!messageId) {
      console.error("send: messageId must be defined");
      throw new Error("send: messageId must be defined");
    }
    const msg = {
      code: 200,
      headers: {
        contentType: "application/json",
        messageId
      },
      message: "OK",
      data: JSON.stringify(value)
    };
    (_a = this.socket) == null ? void 0 : _a.send(JSON.stringify(msg));
  }
};

// adapters/dingtalk/helpers.ts
init_define_MACRO();
function parseDingTalkPayload(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
function isDingTalkDirectMessage(data) {
  return data.conversationType === "1";
}
function getDingTalkSenderId(data) {
  const senderId = data.senderStaffId || data.senderId;
  return senderId ? String(senderId) : null;
}
function getDingTalkChatId(data) {
  const senderId = getDingTalkSenderId(data);
  if (isDingTalkDirectMessage(data)) {
    return senderId ? `dingtalk:dm:${senderId}` : null;
  }
  return data.conversationId ? `dingtalk:group:${data.conversationId}` : null;
}
function extractDingTalkText(data) {
  if (typeof data.text?.content === "string") return data.text.content.trim();
  if (typeof data.markdown?.text === "string") return data.markdown.text.trim();
  const content = resolveContentObject(data.content);
  if (typeof content?.text === "string") return content.text.trim();
  if (Array.isArray(content?.richText)) {
    return content.richText.map((item) => {
      if (!item || typeof item !== "object") return "";
      const text = item.text;
      return typeof text === "string" ? text : "";
    }).join("").trim();
  }
  return "";
}
function extractDingTalkAttachments(data) {
  const content = resolveContentObject(data.content);
  const candidates = [];
  if (data.msgtype === "picture") {
    const url2 = stringValue(content?.pictureUrl);
    const downloadCode = stringValue(content?.downloadCode);
    if (url2 || downloadCode) candidates.push({ kind: "image", url: url2, downloadCode });
  } else if (data.msgtype === "file") {
    const downloadCode = stringValue(content?.downloadCode);
    const fileName = stringValue(content?.fileName) || "dingtalk-file";
    if (downloadCode) candidates.push({ kind: "file", downloadCode, fileName });
  } else if (data.msgtype === "richText") {
    const richText = Array.isArray(content?.richText) ? content.richText : [];
    for (const item of richText) {
      if (!item || typeof item !== "object") continue;
      const record = item;
      const pictureUrl = stringValue(record.pictureUrl);
      const downloadCode = stringValue(record.downloadCode);
      if (pictureUrl || downloadCode) {
        candidates.push({ kind: "image", url: pictureUrl, downloadCode });
      }
    }
  }
  return candidates;
}
function stringValue(value) {
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function resolveContentObject(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

// adapters/dingtalk/media.ts
init_define_MACRO();
import path from "node:path";
var DINGTALK_API = "https://api.dingtalk.com";
var DingTalkMediaService = class {
  constructor(store) {
    this.store = store;
  }
  store;
  async downloadCandidate(candidate, sessionId, opts) {
    const downloadUrl = candidate.url || await this.resolveDownloadUrl(candidate.downloadCode, opts);
    if (!downloadUrl) throw new Error("DingTalk media item is missing a download URL");
    const resp = await fetch(downloadUrl);
    if (!resp.ok) {
      throw new Error(`DingTalk media download failed: ${resp.status} ${resp.statusText}`);
    }
    const buffer = Buffer.from(await resp.arrayBuffer());
    const contentType = resp.headers.get("content-type") || inferMime(candidate.fileName, candidate.kind);
    const name = candidate.fileName || buildImageName(contentType);
    const target = this.store.resolvePath("dingtalk", sessionId, name);
    const savedPath = await this.store.write(target, buffer);
    return {
      kind: candidate.kind,
      name,
      path: savedPath,
      buffer,
      size: buffer.length,
      mimeType: contentType
    };
  }
  async resolveDownloadUrl(downloadCode, opts) {
    if (!downloadCode) return null;
    const resp = await fetch(`${DINGTALK_API}/v1.0/robot/messageFiles/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-acs-dingtalk-access-token": opts.accessToken
      },
      body: JSON.stringify({
        downloadCode,
        robotCode: opts.clientId
      })
    });
    const body = await resp.json().catch(() => null);
    if (!resp.ok || !body?.downloadUrl) {
      throw new Error(body?.message || `DingTalk downloadCode exchange failed: ${resp.status}`);
    }
    return body.downloadUrl;
  }
};
function buildImageName(mime) {
  const ext = mime?.includes("png") ? ".png" : mime?.includes("gif") ? ".gif" : mime?.includes("webp") ? ".webp" : ".jpg";
  return `dingtalk-image-${Date.now()}${ext}`;
}
function inferMime(fileName, kind) {
  if (kind === "image") return "image/jpeg";
  const ext = path.extname(fileName || "").toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".txt") return "text/plain";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

// adapters/dingtalk/ai-card.ts
init_define_MACRO();
var DINGTALK_API2 = "https://api.dingtalk.com";
var AI_CARD_TEMPLATE_ID = "02fcf2f4-5e02-4a85-b672-46d1f715543e.schema";
var CARD_API_MAX_QPS = 20;
var QPS_BACKOFF_DURATION_MS = 2e3;
var DEFAULT_IM_CARD_REQUEST_TIMEOUT_MS = 15e3;
var AICardStatus = {
  INPUTING: "2",
  FINISHED: "3"
};
var DingTalkAiCardService = class {
  constructor(getAccessToken2, robotCode) {
    this.getAccessToken = getAccessToken2;
    this.robotCode = robotCode;
  }
  getAccessToken;
  robotCode;
  async createForTarget(target, options = {}) {
    try {
      const token = await this.getAccessToken();
      const cardInstanceId = options.outTrackId ?? `card_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const createBody = {
        cardTemplateId: options.cardTemplateId || AI_CARD_TEMPLATE_ID,
        outTrackId: cardInstanceId,
        cardData: {
          cardParamMap: {
            config: JSON.stringify({ autoLayout: true }),
            ...options.cardParamMap
          }
        },
        callbackType: "STREAM",
        imGroupOpenSpaceModel: { supportForward: true },
        imRobotOpenSpaceModel: { supportForward: true }
      };
      if (options.callbackRouteKey) createBody.callbackRouteKey = options.callbackRouteKey;
      await postJson("/v1.0/card/instances", token, createBody);
      await postJson("/v1.0/card/instances/deliver", token, buildDeliverBody(cardInstanceId, target, this.robotCode));
      return {
        cardInstanceId,
        accessToken: token,
        tokenExpireTime: Date.now() + 2 * 60 * 60 * 1e3,
        inputingStarted: false
      };
    } catch (err) {
      console.warn("[DingTalk][AICard] create failed:", err instanceof Error ? err.message : err);
      return null;
    }
  }
  async stream(card, content, finished = false) {
    await this.ensureValidToken(card);
    if (!card.inputingStarted) {
      await this.updateStatus(card, AICardStatus.INPUTING, content);
      card.inputingStarted = true;
    }
    await withCardRateLimit(
      () => putJson("/v1.0/card/streaming", card.accessToken, {
        outTrackId: card.cardInstanceId,
        guid: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        key: "msgContent",
        content: ensureTableBlankLines(content),
        isFull: true,
        isFinalize: finished,
        isError: false
      })
    );
  }
  async finish(card, content) {
    await this.stream(card, content, true);
    try {
      await this.updateStatus(card, AICardStatus.FINISHED, ensureTableBlankLines(content));
    } catch (err) {
      console.warn("[DingTalk][AICard] finish status failed:", err instanceof Error ? err.message : err);
    }
  }
  async updateStatus(card, flowStatus, content) {
    const body = {
      outTrackId: card.cardInstanceId,
      cardData: {
        cardParamMap: {
          flowStatus,
          msgContent: ensureTableBlankLines(content),
          staticMsgContent: "",
          sys_full_json_obj: JSON.stringify({ order: ["msgContent"] }),
          config: JSON.stringify({ autoLayout: true })
        }
      }
    };
    if (flowStatus === AICardStatus.FINISHED) {
      body.cardUpdateOptions = { updateCardDataByKey: true };
    }
    await withCardRateLimit(
      () => putJson("/v1.0/card/instances", card.accessToken, body)
    );
  }
  async ensureValidToken(card) {
    if (Date.now() <= card.tokenExpireTime - 5 * 60 * 1e3) return;
    card.accessToken = await this.getAccessToken();
    card.tokenExpireTime = Date.now() + 2 * 60 * 60 * 1e3;
  }
};
function buildDeliverBody(cardInstanceId, target, robotCode) {
  const base = { outTrackId: cardInstanceId, userIdType: 1 };
  if (target.type === "group") {
    return {
      ...base,
      openSpaceId: `dtv1.card//IM_GROUP.${target.openConversationId}`,
      imGroupOpenDeliverModel: {
        robotCode
      }
    };
  }
  return {
    ...base,
    openSpaceId: `dtv1.card//IM_ROBOT.${target.userId}`,
    imRobotOpenDeliverModel: {
      spaceType: "IM_ROBOT",
      robotCode,
      extension: {
        dynamicSummary: "true"
      }
    }
  };
}
async function postJson(path3, token, body) {
  await requestJson("POST", path3, token, body);
}
async function putJson(path3, token, body) {
  await requestJson("PUT", path3, token, body);
}
async function requestJson(method, path3, token, body) {
  const controller = new AbortController();
  const timeoutMs = getImCardRequestTimeoutMs();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${DINGTALK_API2}${path3}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-acs-dingtalk-access-token": token
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`${method} ${path3} failed: ${res.status} ${text}`);
      err.status = res.status;
      err.body = text;
      throw err;
    }
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error(`${method} ${path3} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
function getImCardRequestTimeoutMs() {
  const raw = process.env.CC_HAHA_IM_CARD_REQUEST_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : DEFAULT_IM_CARD_REQUEST_TIMEOUT_MS;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_IM_CARD_REQUEST_TIMEOUT_MS;
}
async function withCardRateLimit(fn) {
  await cardRateLimiter.waitForToken();
  try {
    await fn();
  } catch (err) {
    if (!isQpsLimitError(err)) throw err;
    cardRateLimiter.triggerBackoff();
    await cardRateLimiter.waitForToken();
    await fn();
  }
}
function isQpsLimitError(err) {
  return err?.status === 403 && String(err?.body ?? "").includes("QpsLimit");
}
var cardRateLimiter = {
  tokens: CARD_API_MAX_QPS,
  lastRefillTime: Date.now(),
  backoffUntil: 0,
  queueTail: Promise.resolve(),
  refill() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTime) / 1e3;
    if (elapsedSeconds <= 0) return;
    this.tokens = Math.min(CARD_API_MAX_QPS, this.tokens + elapsedSeconds * CARD_API_MAX_QPS);
    this.lastRefillTime = now;
  },
  async waitForToken() {
    const prev = this.queueTail;
    let release;
    this.queueTail = new Promise((resolve) => {
      release = resolve;
    });
    try {
      await prev.catch(() => {
      });
      const now = Date.now();
      if (now < this.backoffUntil) await sleep(this.backoffUntil - now);
      this.refill();
      if (this.tokens < 1) {
        await sleep(Math.ceil((1 - this.tokens) / CARD_API_MAX_QPS * 1e3));
        this.refill();
      }
      this.tokens -= 1;
    } finally {
      release();
    }
  },
  triggerBackoff() {
    const backoffEnd = Date.now() + QPS_BACKOFF_DURATION_MS;
    this.backoffUntil = backoffEnd;
    this.tokens = 0;
    this.lastRefillTime = backoffEnd;
  }
};
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function ensureTableBlankLines(text) {
  const lines = text.split("\n");
  const result = [];
  const tableDividerRegex = /^\s*\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)+\|?\s*$/;
  const tableRowRegex = /^\s*\|?.*\|.*\|?\s*$/;
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i] ?? "";
    const nextLine = lines[i + 1] ?? "";
    if (tableRowRegex.test(currentLine) && nextLine.includes("|") && tableDividerRegex.test(nextLine) && i > 0 && lines[i - 1]?.trim() !== "" && !tableRowRegex.test(lines[i - 1] ?? "")) {
      result.push("");
    }
    result.push(currentLine);
  }
  return result.join("\n");
}

// adapters/dingtalk/permission-card.ts
init_define_MACRO();
var DINGTALK_PERMISSION_CARD_CALLBACK_ROUTE = "permission";
function buildDingTalkPermissionCardParams(toolName, input, requestId) {
  const allowValue = { action: "permit", requestId, allowed: true };
  const alwaysValue = { action: "permit", requestId, allowed: true, rule: "always" };
  const denyValue = { action: "permit", requestId, allowed: false };
  return {
    title: "Claude Code \u9700\u8981\u6743\u9650\u786E\u8BA4",
    toolName,
    requestId,
    inputPreview: truncateInput(input, 600),
    allowText: "\u5141\u8BB8\u4E00\u6B21",
    alwaysText: "\u6C38\u4E45\u5141\u8BB8",
    denyText: "\u62D2\u7EDD",
    allowValue: JSON.stringify(allowValue),
    alwaysValue: JSON.stringify(alwaysValue),
    denyValue: JSON.stringify(denyValue),
    permissionActions: JSON.stringify([
      { text: "\u5141\u8BB8\u4E00\u6B21", value: allowValue },
      { text: "\u6C38\u4E45\u5141\u8BB8", value: alwaysValue },
      { text: "\u62D2\u7EDD", value: denyValue }
    ]),
    sys_full_json_obj: JSON.stringify({
      order: ["title", "toolName", "inputPreview"],
      actions: ["allowValue", "alwaysValue", "denyValue"]
    }),
    config: JSON.stringify({ autoLayout: true })
  };
}
function parseDingTalkPermissionCardAction(raw) {
  const root = parseMaybeJson(raw);
  const values = collectValues(root);
  for (const value of values) {
    if (typeof value === "string") {
      const direct = parsePermitCallbackData(value);
      if (direct) return direct;
      const parsed = parseMaybeJson(value);
      if (parsed !== value) {
        const nested = parseDingTalkPermissionCardAction(parsed);
        if (nested) return nested;
      }
    }
  }
  const objects = values.filter(isRecord);
  for (const obj of objects) {
    const requestId = readString(obj, ["requestId", "request_id", "permissionRequestId"]);
    if (!requestId) continue;
    const action = readString(obj, ["action", "actionType", "decision", "value", "actionValue", "command"])?.toLowerCase();
    const allowed = readBoolean(obj, ["allowed", "allow", "approved"]);
    const rule = readString(obj, ["rule"]) === "always" ? "always" : void 0;
    const outTrackId = readString(obj, ["outTrackId", "cardInstanceId"]);
    const chatId = readString(obj, ["chatId", "conversationId", "openConversationId"]);
    if (allowed !== void 0) return { requestId, allowed, rule, outTrackId, chatId };
    if (action && ["allow", "yes", "approve", "approved", "permit"].includes(action)) {
      return { requestId, allowed: true, rule, outTrackId, chatId };
    }
    if (action && ["always", "allow-always", "approve-always"].includes(action)) {
      return { requestId, allowed: true, rule: "always", outTrackId, chatId };
    }
    if (action && ["deny", "no", "reject", "rejected"].includes(action)) {
      return { requestId, allowed: false, outTrackId, chatId };
    }
  }
  return null;
}
function parseMaybeJson(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}
function collectValues(value, seen = /* @__PURE__ */ new Set()) {
  const parsed = parseMaybeJson(value);
  if (parsed && typeof parsed === "object") {
    if (seen.has(parsed)) return [];
    seen.add(parsed);
  }
  const values = [parsed];
  if (Array.isArray(parsed)) {
    for (const item of parsed) values.push(...collectValues(item, seen));
  } else if (isRecord(parsed)) {
    for (const item of Object.values(parsed)) values.push(...collectValues(item, seen));
  }
  return values;
}
function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function readString(obj, keys) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return void 0;
}
function readBoolean(obj, keys) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (/^(true|yes|allow|approve|permit)$/i.test(value)) return true;
      if (/^(false|no|deny|reject)$/i.test(value)) return false;
    }
  }
  return void 0;
}

// adapters/dingtalk/stream-state.ts
init_define_MACRO();
function resetDingTalkStreamingState(state, chatId) {
  state.aiCardBuffers.get(chatId)?.reset();
  state.aiCardBuffers.delete(chatId);
  state.streamingCards.delete(chatId);
  state.streamingCardText.delete(chatId);
}
async function finishAndResetDingTalkStreamingState(state, chatId) {
  await state.aiCardBuffers.get(chatId)?.complete();
  if (state.finalize && (state.streamingCards.has(chatId) || state.streamingCardText.has(chatId))) {
    await state.finalize();
  }
  resetDingTalkStreamingState(state, chatId);
}

// adapters/dingtalk/index.ts
var DINGTALK_API3 = "https://api.dingtalk.com";
var config = loadConfig();
if (!config.dingtalk.clientId || !config.dingtalk.clientSecret) {
  console.error("[DingTalk] Missing DINGTALK_CLIENT_ID / DINGTALK_CLIENT_SECRET. Bind with QR auth in Desktop Settings or set env.");
  process.exit(1);
}
var { httpClient, defaultWorkDir } = createAdapterClient(config, config.dingtalk);
var bridge = new WsBridge(config.serverUrl, "dingtalk");
var dedup = new MessageDedup();
var sessionStore = new SessionStore();
var attachmentStore = new AttachmentStore();
var media = new DingTalkMediaService(attachmentStore);
var aiCards = new DingTalkAiCardService(getAccessToken, config.dingtalk.clientId);
var sessionWebhooks = /* @__PURE__ */ new Map();
var projectSelectionController = new ProjectSelectionController({
  httpClient,
  defaultWorkDir,
  prepareNewSession,
  createSession: createSessionForChat
});
var runtimeStates = /* @__PURE__ */ new Map();
var aiCardBuffers = /* @__PURE__ */ new Map();
var aiCardTargets = /* @__PURE__ */ new Map();
var streamingCards = /* @__PURE__ */ new Map();
var streamingCardText = /* @__PURE__ */ new Map();
var pendingPermissions = /* @__PURE__ */ new Map();
var pendingPermissionChats = /* @__PURE__ */ new Map();
var accessTokenCache = null;
attachmentStore.gc().catch((err) => {
  console.warn("[DingTalk] AttachmentStore.gc failed:", err instanceof Error ? err.message : err);
});
function getRuntimeState(chatId) {
  let state = runtimeStates.get(chatId);
  if (!state) {
    state = { state: "idle", pendingPermissionCount: 0 };
    runtimeStates.set(chatId, state);
  }
  return state;
}
async function getAccessToken() {
  const now = Date.now();
  if (accessTokenCache && accessTokenCache.expiresAt > now + 6e4) {
    return accessTokenCache.token;
  }
  const res = await fetch(`${DINGTALK_API3}/v1.0/oauth2/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appKey: config.dingtalk.clientId,
      appSecret: config.dingtalk.clientSecret
    })
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.accessToken) {
    throw new Error(data?.message || `accessToken request failed: ${res.status}`);
  }
  accessTokenCache = {
    token: data.accessToken,
    expiresAt: now + Number(data.expireIn ?? 7200) * 1e3
  };
  return data.accessToken;
}
async function sendText(chatId, text) {
  const sessionWebhook = sessionWebhooks.get(chatId);
  if (!sessionWebhook) {
    console.warn(`[DingTalk] Missing sessionWebhook for ${chatId}; cannot send response`);
    return;
  }
  const token = await getAccessToken();
  for (const chunk of splitMessage(text, 3500)) {
    const res = await fetch(sessionWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-acs-dingtalk-access-token": token
      },
      body: JSON.stringify({
        msgtype: "markdown",
        markdown: {
          title: "Claude Code",
          text: chunk
        }
      })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[DingTalk] sendText failed: ${res.status} ${body}`);
    }
  }
}
function getAiCardBuffer(chatId) {
  let buffer = aiCardBuffers.get(chatId);
  if (!buffer) {
    buffer = new MessageBuffer(
      async (text, isComplete) => flushToAiCard(chatId, text, isComplete),
      1200,
      200
    );
    aiCardBuffers.set(chatId, buffer);
  }
  return buffer;
}
function getOrCreateAiCard(chatId) {
  const target = aiCardTargets.get(chatId);
  if (!target) return null;
  let card = streamingCards.get(chatId);
  if (!card) {
    card = aiCards.createForTarget(target);
    streamingCards.set(chatId, card);
  }
  return card;
}
async function flushToAiCard(chatId, newText, isComplete) {
  const fullText = (streamingCardText.get(chatId) ?? "") + newText;
  streamingCardText.set(chatId, fullText);
  if (!fullText.trim()) return;
  const cardPromise = getOrCreateAiCard(chatId);
  const card = cardPromise ? await cardPromise : null;
  if (!card) {
    if (isComplete) await sendText(chatId, fullText);
    return;
  }
  try {
    if (isComplete) {
      await aiCards.finish(card, fullText);
      streamingCards.delete(chatId);
      streamingCardText.delete(chatId);
      aiCardBuffers.get(chatId)?.reset();
      aiCardBuffers.delete(chatId);
    } else {
      await aiCards.stream(card, `${fullText} \u258D`, false);
    }
  } catch (err) {
    console.warn("[DingTalk][AICard] stream failed, falling back to markdown:", err instanceof Error ? err.message : err);
    streamingCards.delete(chatId);
    if (isComplete) await sendText(chatId, fullText);
  }
}
function clearTransientChatState(chatId) {
  resetDingTalkStreamingState({ aiCardBuffers, streamingCards, streamingCardText }, chatId);
  clearPendingPermissions(chatId);
  const runtime = getRuntimeState(chatId);
  runtime.state = "idle";
  runtime.verb = void 0;
  runtime.pendingPermissionCount = 0;
}
function clearPendingPermissions(chatId) {
  const pending = pendingPermissions.get(chatId);
  if (pending) {
    for (const requestId of pending) pendingPermissionChats.delete(requestId);
  }
  pendingPermissions.delete(chatId);
}
async function ensureExistingSession(chatId) {
  return await restoreStoredSessionBinding({
    chatId,
    bridge,
    sessionStore,
    httpClient,
    onServerMessage: (msg) => handleServerMessage(chatId, msg),
    logPrefix: "[DingTalk]",
    clearTransientState: () => clearTransientChatState(chatId)
  });
}
async function buildStatusText(chatId) {
  const stored = await ensureExistingSession(chatId);
  if (!stored) return formatImStatus(null);
  const runtime = getRuntimeState(chatId);
  let projectName = path2.basename(stored.workDir) || stored.workDir;
  let branch = null;
  try {
    const gitInfo = await httpClient.getGitInfo(stored.sessionId);
    projectName = gitInfo.repoName || path2.basename(gitInfo.workDir) || projectName;
    branch = gitInfo.branch;
  } catch {
  }
  let taskCounts;
  try {
    const tasks = await httpClient.getTasksForSession(stored.sessionId);
    if (tasks.length > 0) {
      taskCounts = {
        total: tasks.length,
        pending: tasks.filter((task) => task.status === "pending").length,
        inProgress: tasks.filter((task) => task.status === "in_progress").length,
        completed: tasks.filter((task) => task.status === "completed").length
      };
    }
  } catch {
  }
  return formatImStatus({
    sessionId: stored.sessionId,
    projectName,
    branch,
    model: runtime.model,
    state: runtime.state,
    verb: runtime.verb,
    pendingPermissionCount: runtime.pendingPermissionCount,
    taskCounts
  });
}
async function ensureSession(chatId) {
  const stored = await ensureExistingSession(chatId);
  if (stored) return true;
  return await createSessionForChat(chatId, defaultWorkDir);
}
async function createSessionForChat(chatId, workDir) {
  try {
    bridge.resetSession(chatId);
    clearTransientChatState(chatId);
    const sessionId = await httpClient.createSession(workDir);
    sessionStore.set(chatId, sessionId, workDir);
    bridge.connectSession(chatId, sessionId);
    bridge.onServerMessage(chatId, (msg) => handleServerMessage(chatId, msg));
    const opened = await bridge.waitForOpen(chatId);
    if (!opened) {
      await sendText(chatId, "\u26A0\uFE0F \u8FDE\u63A5\u670D\u52A1\u5668\u8D85\u65F6\uFF0C\u8BF7\u91CD\u8BD5\u3002");
      return false;
    }
    return true;
  } catch (err) {
    await sendText(chatId, `\u274C \u65E0\u6CD5\u521B\u5EFA\u4F1A\u8BDD: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
function formatProjectList(projects) {
  const lines = projects.slice(0, 10).map((project, index) => {
    const branch = project.branch ? ` (${project.branch})` : "";
    return `${index + 1}. **${project.projectName}**${branch}
   ${project.realPath}`;
  });
  return `\u9009\u62E9\u9879\u76EE\uFF08\u56DE\u590D\u7F16\u53F7\uFF09\uFF1A

${lines.join("\n\n")}

\u4E5F\u53EF\u4EE5\u53D1\u9001 /new <\u7F16\u53F7\u6216\u540D\u79F0>`;
}
async function showProjectPicker(chatId) {
  try {
    const projects = await projectSelectionController.listProjects(chatId);
    if (projects.length === 0) {
      await sendText(chatId, `\u6CA1\u6709\u627E\u5230\u6700\u8FD1\u7684\u9879\u76EE\u3002\u53D1\u9001 /new \u4F1A\u4F7F\u7528\u9ED8\u8BA4\u5DE5\u4F5C\u76EE\u5F55\uFF1A${defaultWorkDir}
\u4E5F\u53EF\u4EE5\u53D1\u9001 /new /path/to/project \u6307\u5B9A\u9879\u76EE\u3002`);
      return;
    }
    await sendText(chatId, formatProjectList(projects));
  } catch (err) {
    await sendText(chatId, `\u274C \u65E0\u6CD5\u83B7\u53D6\u9879\u76EE\u5217\u8868: ${err instanceof Error ? err.message : String(err)}`);
  }
}
function prepareNewSession(chatId) {
  bridge.resetSession(chatId);
  sessionStore.delete(chatId);
  clearTransientChatState(chatId);
  runtimeStates.delete(chatId);
}
async function handleServerMessage(chatId, msg) {
  const runtime = getRuntimeState(chatId);
  switch (msg.type) {
    case "connected":
      break;
    case "status":
      runtime.state = msg.state;
      runtime.verb = typeof msg.verb === "string" ? msg.verb : void 0;
      break;
    case "content_start":
      if (msg.blockType === "text") {
        runtime.state = "streaming";
      }
      if (msg.blockType === "tool_use") runtime.state = "tool_executing";
      break;
    case "content_delta":
      if (typeof msg.text === "string" && msg.text) getAiCardBuffer(chatId).append(msg.text);
      break;
    case "tool_use_complete":
      runtime.state = "streaming";
      break;
    case "permission_request": {
      await sendPermissionRequest(chatId, msg);
      break;
    }
    case "message_complete":
      runtime.state = "idle";
      runtime.verb = void 0;
      await finishAndResetDingTalkStreamingState({ aiCardBuffers, streamingCards, streamingCardText, finalize: () => flushToAiCard(chatId, "", true) }, chatId);
      break;
    case "error":
      runtime.state = "idle";
      runtime.verb = void 0;
      aiCardBuffers.get(chatId)?.reset();
      streamingCards.delete(chatId);
      streamingCardText.delete(chatId);
      await sendText(chatId, `\u274C ${msg.message}`);
      break;
    case "system_notification":
      if (msg.subtype === "init" && msg.data && typeof msg.data === "object") {
        const model = msg.data.model;
        if (typeof model === "string" && model.trim()) runtime.model = model;
      }
      break;
  }
}
async function sendPermissionRequest(chatId, msg) {
  const runtime = getRuntimeState(chatId);
  runtime.pendingPermissionCount += 1;
  runtime.state = "permission_pending";
  await finishAndResetDingTalkStreamingState({ aiCardBuffers, streamingCards, streamingCardText, finalize: () => flushToAiCard(chatId, "", true) }, chatId);
  const set = pendingPermissions.get(chatId) ?? /* @__PURE__ */ new Set();
  set.add(msg.requestId);
  pendingPermissions.set(chatId, set);
  pendingPermissionChats.set(msg.requestId, chatId);
  const requestText = formatPermissionRequest(msg.toolName, msg.input, msg.requestId);
  const instructions = formatPermissionInstructions(msg.requestId);
  const templateId = config.dingtalk.permissionCardTemplateId.trim();
  const target = aiCardTargets.get(chatId);
  if (templateId && target) {
    const card = await aiCards.createForTarget(target, {
      cardTemplateId: templateId,
      outTrackId: `permission_${msg.requestId}`,
      callbackRouteKey: DINGTALK_PERMISSION_CARD_CALLBACK_ROUTE,
      cardParamMap: buildDingTalkPermissionCardParams(msg.toolName, msg.input, msg.requestId)
    });
    if (card) {
      await sendText(chatId, `${requestText}

\u5DF2\u53D1\u9001\u9489\u9489\u6743\u9650\u5361\u7247\uFF1B\u5982\u679C\u5361\u7247\u4E0D\u53EF\u89C1\uFF0C\u4E5F\u53EF\u4EE5${instructions}`);
      return;
    }
  }
  await sendText(chatId, `${requestText}

${instructions}`);
}
function handlePermissionCommand(chatId, text) {
  const decision = parsePermissionCommand(text, pendingPermissions.get(chatId));
  if (!decision) return false;
  const sent = applyPermissionDecision(chatId, decision);
  if (!sent) return true;
  void sendText(chatId, formatPermissionDecisionStatus(decision));
  return true;
}
function applyPermissionDecision(chatId, decision) {
  const { requestId, allowed, rule } = decision;
  const pending = pendingPermissions.get(chatId);
  if (!pending?.has(requestId)) {
    void sendText(chatId, `\u672A\u627E\u5230\u5F85\u786E\u8BA4\u7684\u6743\u9650\u8BF7\u6C42\uFF1A${requestId}`);
    return false;
  }
  const sent = bridge.sendPermissionResponse(chatId, requestId, allowed, rule);
  if (!sent) {
    void sendText(chatId, "\u6743\u9650\u54CD\u5E94\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u4F1A\u8BDD\u72B6\u6001\u3002");
    return false;
  }
  pending.delete(requestId);
  pendingPermissionChats.delete(requestId);
  const runtime = getRuntimeState(chatId);
  runtime.pendingPermissionCount = Math.max(0, runtime.pendingPermissionCount - 1);
  return sent;
}
async function routeUserMessage(chatId, text, attachments = []) {
  enqueue(chatId, async () => {
    const trimmed = text.trim();
    const hasAttachments = attachments.length > 0;
    if (!hasAttachments && handlePermissionCommand(chatId, trimmed)) return;
    const projectOutcome = !hasAttachments ? await projectSelectionController.handleInput(chatId, trimmed) : null;
    if (projectOutcome) {
      const response = formatProjectSelectionOutcome(projectOutcome);
      if (response) await sendText(chatId, response);
      return;
    }
    if (!hasAttachments && (trimmed === "/help" || trimmed === "\u5E2E\u52A9")) {
      await sendText(chatId, formatImHelp());
      return;
    }
    if (!hasAttachments && (trimmed === "/status" || trimmed === "\u72B6\u6001")) {
      await sendText(chatId, await buildStatusText(chatId));
      return;
    }
    if (!hasAttachments && (trimmed === "/clear" || trimmed === "\u6E05\u7A7A")) {
      const stored = await ensureExistingSession(chatId);
      if (!stored) {
        await sendText(chatId, formatImStatus(null));
        return;
      }
      clearTransientChatState(chatId);
      if (!bridge.sendUserMessage(chatId, "/clear")) {
        await sendText(chatId, "\u26A0\uFE0F \u65E0\u6CD5\u53D1\u9001 /clear\uFF0C\u8BF7\u5148\u53D1\u9001 /new \u91CD\u65B0\u8FDE\u63A5\u4F1A\u8BDD\u3002");
        return;
      }
      await sendText(chatId, "\u{1F9F9} \u5DF2\u6E05\u7A7A\u5F53\u524D\u4F1A\u8BDD\u4E0A\u4E0B\u6587\u3002");
      return;
    }
    if (!hasAttachments && (trimmed === "/stop" || trimmed === "\u505C\u6B62")) {
      const stored = await ensureExistingSession(chatId);
      if (!stored) {
        await sendText(chatId, formatImStatus(null));
        return;
      }
      bridge.sendStopGeneration(chatId);
      await sendText(chatId, "\u23F9 \u5DF2\u53D1\u9001\u505C\u6B62\u4FE1\u53F7\u3002");
      return;
    }
    if (!hasAttachments && (trimmed === "/projects" || trimmed === "\u9879\u76EE\u5217\u8868")) {
      await showProjectPicker(chatId);
      return;
    }
    const ready = await ensureSession(chatId);
    if (!ready) return;
    const effectiveText = trimmed || (attachments.length > 0 ? "(\u7528\u6237\u53D1\u9001\u4E86\u9644\u4EF6)" : "");
    if (!effectiveText && attachments.length === 0) return;
    if (!bridge.sendUserMessage(chatId, effectiveText, attachments.length ? attachments : void 0)) {
      await sendText(chatId, "\u26A0\uFE0F \u6D88\u606F\u53D1\u9001\u5931\u8D25\uFF0C\u8FDE\u63A5\u53EF\u80FD\u5DF2\u65AD\u5F00\u3002\u8BF7\u53D1\u9001 /new \u91CD\u65B0\u5F00\u59CB\u3002");
    }
  });
}
async function handleRobotMessage(data) {
  if (!isDingTalkDirectMessage(data)) return;
  const chatId = getDingTalkChatId(data);
  const userId = getDingTalkSenderId(data);
  const text = extractDingTalkText(data);
  const mediaCandidates = extractDingTalkAttachments(data);
  if (!chatId || !userId || !text && mediaCandidates.length === 0) return;
  if (data.sessionWebhook) sessionWebhooks.set(chatId, data.sessionWebhook);
  if (!isAllowedUser("dingtalk", userId)) {
    const success = tryPair(text, { userId, displayName: data.senderNick || "DingTalk User" }, "dingtalk");
    await sendText(
      chatId,
      success ? "\u2705 \u914D\u5BF9\u6210\u529F\uFF01\u73B0\u5728\u53EF\u4EE5\u5F00\u59CB\u804A\u5929\u4E86\u3002\n\n\u53D1\u9001\u6D88\u606F\u5373\u53EF\u4E0E Claude \u5BF9\u8BDD\u3002\u53D1\u9001 /help \u67E5\u770B\u53EF\u7528\u547D\u4EE4\u3002" : "\u{1F512} \u672A\u6388\u6743\u3002\u8BF7\u5148\u5728 Claude Code \u684C\u9762\u7AEF\u5B8C\u6210\u9489\u9489\u626B\u7801\u7ED1\u5B9A\uFF0C\u518D\u751F\u6210 IM \u914D\u5BF9\u7801\u540E\u53D1\u9001\u7ED9\u6211\u3002"
    );
    return;
  }
  aiCardTargets.set(chatId, { type: "user", userId });
  const attachments = await collectAttachments(chatId, mediaCandidates);
  await routeUserMessage(chatId, text, attachments);
}
async function handleCardCallback(raw) {
  const action = parseDingTalkPermissionCardAction(raw);
  if (!action) return;
  const chatId = action.chatId && pendingPermissions.has(action.chatId) ? action.chatId : pendingPermissionChats.get(action.requestId);
  if (!chatId) {
    console.warn(`[DingTalk][Card] permission request not found: ${action.requestId}`);
    return;
  }
  if (applyPermissionDecision(chatId, action)) {
    await sendText(chatId, formatPermissionDecisionStatus(action));
  }
}
async function collectAttachments(chatId, candidates) {
  if (candidates.length === 0) return [];
  const stored = sessionStore.get(chatId);
  const sessionId = stored?.sessionId ?? chatId;
  let token;
  try {
    token = await getAccessToken();
  } catch (err) {
    console.error("[DingTalk] access token for attachment download failed:", err);
    await sendText(chatId, "\u{1F4CE} \u9644\u4EF6\u4E0B\u8F7D\u6388\u6743\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
    return [];
  }
  const settled = await Promise.allSettled(
    candidates.map(
      (candidate) => media.downloadCandidate(candidate, sessionId, {
        clientId: config.dingtalk.clientId,
        accessToken: token
      })
    )
  );
  const attachments = [];
  let failures = 0;
  for (const result of settled) {
    if (result.status === "rejected") {
      failures += 1;
      console.error("[DingTalk] media download failed:", result.reason);
      continue;
    }
    const local = result.value;
    const check = checkAttachmentLimit(local.kind, local.size, local.mimeType);
    if (!check.ok) {
      await sendText(chatId, check.hint);
      continue;
    }
    if (local.kind === "image") {
      attachments.push({
        type: "image",
        name: local.name,
        data: local.buffer.toString("base64"),
        mimeType: local.mimeType
      });
    } else {
      attachments.push({
        type: "file",
        name: local.name,
        path: local.path,
        mimeType: local.mimeType
      });
    }
  }
  if (failures > 0) {
    await sendText(
      chatId,
      failures === candidates.length ? "\u{1F4CE} \u9644\u4EF6\u4E0B\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002" : `\u{1F4CE} ${failures} \u4E2A\u9644\u4EF6\u4E0B\u8F7D\u5931\u8D25\uFF0C\u5DF2\u8DF3\u8FC7\u3002`
    );
  }
  return attachments;
}
async function start() {
  const client = new DWClient({
    clientId: config.dingtalk.clientId,
    clientSecret: config.dingtalk.clientSecret,
    endpoint: config.dingtalk.endpoint,
    autoReconnect: true,
    keepAlive: true
  });
  client.registerCallbackListener(TOPIC_ROBOT, async (res) => {
    const messageId = res.headers?.messageId;
    if (messageId) {
      client.socketCallBackResponse(messageId, { success: true });
      if (!dedup.tryRecord(`header:${messageId}`)) return;
    }
    const data = parseDingTalkPayload(res.data);
    if (!data) return;
    if (data.msgId && !dedup.tryRecord(`body:${data.msgId}`)) return;
    await handleRobotMessage(data);
  });
  client.registerCallbackListener(TOPIC_CARD, async (res) => {
    const messageId = res.headers?.messageId;
    if (messageId) {
      client.socketCallBackResponse(messageId, { success: true });
      if (!dedup.tryRecord(`card:${messageId}`)) return;
    }
    await handleCardCallback(res.data ?? res);
  });
  await client.connect();
  console.log(`[DingTalk] Stream connected. Server: ${config.serverUrl}`);
  const shutdown = async () => {
    console.log("[DingTalk] Shutting down...");
    bridge.destroy();
    dedup.destroy();
    try {
      await client.disconnect();
    } catch {
    }
    process.exit(0);
  };
  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
}
start().catch((err) => {
  console.error("[DingTalk] Fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
//# sourceMappingURL=dingtalk-ZDMP332D.mjs.map
