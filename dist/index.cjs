"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var import_bencode = __toESM(require("bencode"), 1);
var import_bitfield = __toESM(require("bitfield"), 1);
var import_one_webcrypto = __toESM(require("@bicycle-codes/one-webcrypto"), 1);
var import_rc4 = __toESM(require("rc4"), 1);
var import_streamx = require("streamx");
var import_uint8_util = require("@substrate-system/uint8-util");
var import_throughput = __toESM(require("throughput"), 1);
var import_unordered_array_remove = __toESM(require("unordered-array-remove"), 1);
var import_debug = __toESM(require("@substrate-system/debug"), 1);
/*! bittorrent-protocol. MIT License. WebTorrent LLC <https://webtorrent.io/opensource> */
const debug = (0, import_debug.default)("bittorrent-protocol");
const BITFIELD_GROW = 4e5;
const KEEP_ALIVE_TIMEOUT = 55e3;
const ALLOWED_FAST_SET_MAX_LENGTH = 100;
const MESSAGE_PROTOCOL = (0, import_uint8_util.text2arr)("BitTorrent protocol");
const MESSAGE_KEEP_ALIVE = new Uint8Array([0, 0, 0, 0]);
const MESSAGE_CHOKE = new Uint8Array([0, 0, 0, 1, 0]);
const MESSAGE_UNCHOKE = new Uint8Array([0, 0, 0, 1, 1]);
const MESSAGE_INTERESTED = new Uint8Array([0, 0, 0, 1, 2]);
const MESSAGE_UNINTERESTED = new Uint8Array([0, 0, 0, 1, 3]);
const MESSAGE_RESERVED = [0, 0, 0, 0, 0, 0, 0, 0];
const MESSAGE_PORT = [0, 0, 0, 3, 9, 0, 0];
const MESSAGE_HAVE_ALL = new Uint8Array([0, 0, 0, 1, 14]);
const MESSAGE_HAVE_NONE = new Uint8Array([0, 0, 0, 1, 15]);
const DH_PRIME = "ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a63a36210000000000090563";
const DH_GENERATOR = 2;
const VC = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
const CRYPTO_PROVIDE = new Uint8Array([0, 0, 1, 2]);
const CRYPTO_SELECT = new Uint8Array([0, 0, 0, 2]);
function xor(a, b) {
  for (let len = a.length; len--; ) a[len] ^= b[len];
  return a;
}
__name(xor, "xor");
class Request {
  static {
    __name(this, "Request");
  }
  piece;
  offset;
  length;
  callback;
  constructor(piece, offset, length, callback) {
    this.piece = piece;
    this.offset = offset;
    this.length = length;
    this.callback = callback;
  }
}
class HaveAllBitField {
  static {
    __name(this, "HaveAllBitField");
  }
  buffer;
  constructor() {
    this.buffer = new Uint8Array();
  }
  get(_index) {
    return true;
  }
  set(_index) {
  }
}
class Wire extends import_streamx.Duplex {
  static {
    __name(this, "Wire");
  }
  _debugId;
  peerId;
  peerIdBuffer;
  type;
  amChoking;
  amInterested;
  peerChoking;
  peerInterested;
  _dh;
  _myPubKey;
  _setGenerators;
  _decryptGenerator;
  _encryptGenerator;
  _encryptMethod;
  // the maximum number of bytes resynchronization must occur within
  _waitMaxBytes;
  // the pattern to search for when resynchronizing after receiving pe1/pe2
  _cryptoSyncPattern;
  _peerPubKey;
  // peer's DH public key
  _sharedSecret;
  // shared DH secret
  _cryptoHandshakeDone;
  _peerCryptoProvide;
  // encryption methods provided by peer; we expect this
  //                     to always contain 0x02
  peerPieces;
  extensions;
  peerExtensions;
  requests;
  // outgoing
  peerRequests;
  // incoming
  extendedMapping;
  // number -> string, ex: 1 -> 'ut_metadata'
  peerExtendedMapping;
  // string -> number, ex: 9 -> 'ut_metadata'
  peerExtendedHandshake;
  // The extended handshake to send, minus the "m" field, which gets
  //   automatically filled from `this.extendedMapping`
  extendedHandshake = {};
  // BEP6 Fast Estension
  hasFast;
  // is fast extension enabled?
  allowedFastSet;
  // allowed fast set
  peerAllowedFastSet;
  // peer's allowed fast set
  // string -> function, ex 'ut_metadata' -> ut_metadata()
  _ext;
  _nextExt;
  uploaded;
  downloaded;
  uploadSpeed;
  downloadSpeed;
  _keepAliveInterval = null;
  _timeout = null;
  _timeoutMs = 0;
  _timeoutExpiresAt = null;
  _finished;
  _parserSize;
  // number of needed bytes to parse next message from remote peer
  _parser;
  // function to call once `this._parserSize` bytes are available
  _buffer;
  // incomplete message data
  _bufferSize;
  // cached total length of buffers in `this._buffer`
  _peEnabled;
  constructor(type = null, retries = 0, peEnabled = false) {
    super();
    this._debugId = (0, import_uint8_util.arr2hex)((0, import_uint8_util.randomBytes)(4));
    this._debug("new wire");
    this.peerId = null;
    this.peerIdBuffer = null;
    this.type = type;
    this.amChoking = true;
    this.amInterested = false;
    this.peerChoking = true;
    this.peerInterested = false;
    this.peerPieces = new import_bitfield.default(0, { grow: BITFIELD_GROW });
    this.extensions = {};
    this.peerExtensions = {};
    this.requests = [];
    this.peerRequests = [];
    this.extendedMapping = {};
    this.peerExtendedMapping = {};
    this.peerExtendedHandshake = {};
    this.hasFast = false;
    this.allowedFastSet = [];
    this.peerAllowedFastSet = [];
    this._ext = {};
    this._nextExt = 1;
    this.uploaded = 0;
    this.downloaded = 0;
    this.uploadSpeed = (0, import_throughput.default)();
    this.downloadSpeed = (0, import_throughput.default)();
    this._keepAliveInterval = null;
    this._timeout = null;
    this._timeoutMs = 0;
    this._timeoutExpiresAt = null;
    this._finished = false;
    this._parserSize = 0;
    this._parser = null;
    this._buffer = [];
    this._bufferSize = 0;
    this._peEnabled = peEnabled;
    if (peEnabled) {
      this._dh = import_one_webcrypto.default.createDiffieHellman(DH_PRIME, "hex", DH_GENERATOR);
      this._myPubKey = this._dh.generateKeys("hex");
    } else {
      this._myPubKey = null;
    }
    this._peerPubKey = null;
    this._sharedSecret = null;
    this._peerCryptoProvide = [];
    this._cryptoHandshakeDone = false;
    this._cryptoSyncPattern = null;
    this._waitMaxBytes = null;
    this._encryptionMethod = null;
    this._encryptGenerator = null;
    this._decryptGenerator = null;
    this._setGenerators = false;
    this.once("finish", () => this._onFinish());
    this.on("finish", this._onFinish);
    this._debug("type:", this.type);
    if (this.type === "tcpIncoming" && this._peEnabled) {
      this._determineHandshakeType();
    } else if (this.type === "tcpOutgoing" && this._peEnabled && retries === 0) {
      this._parsePe2();
    } else {
      this._parseHandshake(null);
    }
  }
  /**
  * Set whether to send a "keep-alive" ping (sent every 55s)
  * @param {boolean} enable
  */
  setKeepAlive(enable) {
    this._debug("setKeepAlive %s", enable);
    clearInterval(this._keepAliveInterval);
    if (enable === false) return;
    this._keepAliveInterval = setInterval(() => {
      this.keepAlive();
    }, KEEP_ALIVE_TIMEOUT);
  }
  /**
  * Set the amount of time to wait before considering a request to be "timed out"
  * @param {number} ms
  * @param {boolean=} unref (should the timer be unref'd? default: false)
  */
  setTimeout(ms, unref) {
    this._debug("setTimeout ms=%d unref=%s", ms, unref);
    this._timeoutMs = ms;
    this._timeoutUnref = !!unref;
    this._resetTimeout(true);
  }
  destroy() {
    if (this.destroyed) return;
    this._debug("destroy");
    this.end();
    return this;
  }
  end(data) {
    if (this.destroyed || this.destroying) return;
    this._debug("end");
    this._onUninterested();
    this._onChoke();
    return super.end(data);
  }
  /**
  * Use the specified protocol extension.
  * @param  {function} Extension
  */
  use(Extension) {
    const name = Extension.prototype.name;
    if (!name) {
      throw new Error('Extension class requires a "name" property on the prototype');
    }
    this._debug("use extension.name=%s", name);
    const ext = this._nextExt;
    const handler = new Extension(this);
    function noop() {
    }
    __name(noop, "noop");
    if (typeof handler.onHandshake !== "function") {
      handler.onHandshake = noop;
    }
    if (typeof handler.onExtendedHandshake !== "function") {
      handler.onExtendedHandshake = noop;
    }
    if (typeof handler.onMessage !== "function") {
      handler.onMessage = noop;
    }
    this.extendedMapping[ext] = name;
    this._ext[name] = handler;
    this[name] = handler;
    this._nextExt += 1;
  }
  //
  // OUTGOING MESSAGES
  //
  /**
  * Message "keep-alive": <len=0000>
  */
  keepAlive() {
    this._debug("keep-alive");
    this._push(MESSAGE_KEEP_ALIVE);
  }
  sendPe1() {
    if (this._peEnabled) {
      const padALen = Math.floor(Math.random() * 513);
      const padA = (0, import_uint8_util.randomBytes)(padALen);
      this._push((0, import_uint8_util.concat)([(0, import_uint8_util.hex2arr)(this._myPubKey), padA]));
    }
  }
  sendPe2() {
    const padBLen = Math.floor(Math.random() * 513);
    const padB = (0, import_uint8_util.randomBytes)(padBLen);
    this._push((0, import_uint8_util.concat)([(0, import_uint8_util.hex2arr)(this._myPubKey), padB]));
  }
  async sendPe3(infoHash) {
    await this.setEncrypt(this._sharedSecret, infoHash);
    const hash1Buffer = await (0, import_uint8_util.hash)((0, import_uint8_util.hex2arr)(this._utfToHex("req1") + this._sharedSecret));
    const hash2Buffer = await (0, import_uint8_util.hash)((0, import_uint8_util.hex2arr)(this._utfToHex("req2") + infoHash));
    const hash3Buffer = await (0, import_uint8_util.hash)((0, import_uint8_util.hex2arr)(this._utfToHex("req3") + this._sharedSecret));
    const hashesXorBuffer = xor(hash2Buffer, hash3Buffer);
    const padCLen = new DataView((0, import_uint8_util.randomBytes)(2).buffer).getUint16(0) % 512;
    const padCBuffer = (0, import_uint8_util.randomBytes)(padCLen);
    let vcAndProvideBuffer = new Uint8Array(8 + 4 + 2 + padCLen + 2);
    vcAndProvideBuffer.set(VC);
    vcAndProvideBuffer.set(CRYPTO_PROVIDE, 8);
    const view = new DataView(vcAndProvideBuffer.buffer);
    view.setInt16(12, padCLen);
    padCBuffer.copy(vcAndProvideBuffer, 14);
    view.setInt16(14 + padCLen, 0);
    vcAndProvideBuffer = this._encryptHandshake(vcAndProvideBuffer);
    this._push((0, import_uint8_util.concat)([hash1Buffer, hashesXorBuffer, vcAndProvideBuffer]));
  }
  async sendPe4(infoHash) {
    await this.setEncrypt(this._sharedSecret, infoHash);
    const padDLen = new DataView((0, import_uint8_util.randomBytes)(2).buffer).getUint16(0) % 512;
    const padDBuffer = (0, import_uint8_util.randomBytes)(padDLen);
    let vcAndSelectBuffer = new Uint8Array(8 + 4 + 2 + padDLen);
    const view = new DataView(vcAndSelectBuffer.buffer);
    vcAndSelectBuffer.set(VC);
    vcAndSelectBuffer.set(CRYPTO_SELECT, 8);
    view.setInt16(12, padDLen);
    vcAndSelectBuffer.set(padDBuffer, 14);
    vcAndSelectBuffer = this._encryptHandshake(vcAndSelectBuffer);
    this._push(vcAndSelectBuffer);
    this._cryptoHandshakeDone = true;
    this._debug("completed crypto handshake");
  }
  /**
  * Message: "handshake" <pstrlen><pstr><reserved><info_hash><peer_id>
  * @param  {Uint8Array|string} infoHash (as Buffer or *hex* string)
  * @param  {Uint8Array|string} peerId
  * @param  {Object} extensions
  */
  handshake(infoHash, peerId, extensions) {
    let infoHashBuffer;
    let peerIdBuffer;
    if (typeof infoHash === "string") {
      infoHash = infoHash.toLowerCase();
      infoHashBuffer = (0, import_uint8_util.hex2arr)(infoHash);
    } else {
      infoHashBuffer = infoHash;
      infoHash = (0, import_uint8_util.arr2hex)(infoHashBuffer);
    }
    if (typeof peerId === "string") {
      peerIdBuffer = (0, import_uint8_util.hex2arr)(peerId);
    } else {
      peerIdBuffer = peerId;
      peerId = (0, import_uint8_util.arr2hex)(peerIdBuffer);
    }
    this._infoHash = infoHashBuffer;
    if (infoHashBuffer.length !== 20 || peerIdBuffer.length !== 20) {
      throw new Error("infoHash and peerId MUST have length 20");
    }
    this._debug("handshake i=%s p=%s exts=%o", infoHash, peerId, extensions);
    const reserved = new Uint8Array(MESSAGE_RESERVED);
    this.extensions = {
      extended: true,
      dht: !!(extensions && extensions.dht),
      fast: !!(extensions && extensions.fast)
    };
    reserved[5] |= 16;
    if (this.extensions.dht) reserved[7] |= 1;
    if (this.extensions.fast) reserved[7] |= 4;
    if (this.extensions.fast && this.peerExtensions.fast) {
      this._debug("fast extension is enabled");
      this.hasFast = true;
    }
    this._push((0, import_uint8_util.concat)([MESSAGE_PROTOCOL, reserved, infoHashBuffer, peerIdBuffer]));
    this._handshakeSent = true;
    if (this.peerExtensions.extended && !this._extendedHandshakeSent) {
      this._sendExtendedHandshake();
    }
  }
  /* Peer supports BEP-0010, send extended handshake.
  *
  * This comes after the 'handshake' event to give the user a chance to populate
  * `this.extendedHandshake` and `this.extendedMapping` before the extended handshake
  * is sent to the remote peer.
  */
  _sendExtendedHandshake() {
    const msg = Object.assign({}, this.extendedHandshake);
    msg.m = {};
    for (const ext in this.extendedMapping) {
      const name = this.extendedMapping[ext];
      msg.m[name] = Number(ext);
    }
    this.extended(0, import_bencode.default.encode(msg));
    this._extendedHandshakeSent = true;
  }
  /**
  * Message "choke": <len=0001><id=0>
  */
  choke() {
    if (this.amChoking) return;
    this.amChoking = true;
    this._debug("choke");
    this._push(MESSAGE_CHOKE);
    if (this.hasFast) {
      let allowedCount = 0;
      while (this.peerRequests.length > allowedCount) {
        const request = this.peerRequests[allowedCount];
        if (this.allowedFastSet.includes(request.piece)) {
          ++allowedCount;
        } else {
          this.reject(request.piece, request.offset, request.length);
        }
      }
    } else {
      while (this.peerRequests.length) {
        this.peerRequests.pop();
      }
    }
  }
  /**
  * Message "unchoke": <len=0001><id=1>
  */
  unchoke() {
    if (!this.amChoking) return;
    this.amChoking = false;
    this._debug("unchoke");
    this._push(MESSAGE_UNCHOKE);
  }
  /**
  * Message "interested": <len=0001><id=2>
  */
  interested() {
    if (this.amInterested) return;
    this.amInterested = true;
    this._debug("interested");
    this._push(MESSAGE_INTERESTED);
  }
  /**
  * Message "uninterested": <len=0001><id=3>
  */
  uninterested() {
    if (!this.amInterested) return;
    this.amInterested = false;
    this._debug("uninterested");
    this._push(MESSAGE_UNINTERESTED);
  }
  /**
  * Message "have": <len=0005><id=4><piece index>
  * @param  {number} index
  */
  have(index) {
    this._debug("have %d", index);
    this._message(4, [index], null);
  }
  /**
  * Message "bitfield": <len=0001+X><id=5><bitfield>
  * @param  {BitField|Buffer} bitfield
  */
  bitfield(bitfield) {
    this._debug("bitfield");
    if (!ArrayBuffer.isView(bitfield)) bitfield = bitfield.buffer;
    this._message(5, [], bitfield);
  }
  /**
  * Message "request": <len=0013><id=6><index><begin><length>
  * @param  {number}   index
  * @param  {number}   offset
  * @param  {number}   length
  * @param  {function} cb
  */
  request(index, offset, length, cb) {
    if (!cb) cb = /* @__PURE__ */ __name(() => {
    }, "cb");
    if (this._finished) return cb(new Error("wire is closed"));
    if (this.peerChoking && !(this.hasFast && this.peerAllowedFastSet.includes(index))) {
      return cb(new Error("peer is choking"));
    }
    this._debug("request index=%d offset=%d length=%d", index, offset, length);
    this.requests.push(new Request(index, offset, length, cb));
    if (!this._timeout) {
      this._resetTimeout(true);
    }
    this._message(6, [index, offset, length], null);
  }
  /**
  * Message "piece": <len=0009+X><id=7><index><begin><block>
  * @param  {number} index
  * @param  {number} offset
  * @param  {Uint8Array} buffer
  */
  piece(index, offset, buffer) {
    this._debug("piece index=%d offset=%d", index, offset);
    this._message(7, [index, offset], buffer);
    this.uploaded += buffer.length;
    this.uploadSpeed(buffer.length);
    this.emit("upload", buffer.length);
  }
  /**
  * Message "cancel": <len=0013><id=8><index><begin><length>
  * @param  {number} index
  * @param  {number} offset
  * @param  {number} length
  */
  cancel(index, offset, length) {
    this._debug("cancel index=%d offset=%d length=%d", index, offset, length);
    this._callback(
      this._pull(this.requests, index, offset, length),
      new Error("request was cancelled"),
      null
    );
    this._message(8, [index, offset, length], null);
  }
  /**
  * Message: "port" <len=0003><id=9><listen-port>
  * @param {Number} port
  */
  port(port) {
    this._debug("port %d", port);
    const message = new Uint8Array(MESSAGE_PORT);
    const view = new DataView(message.buffer);
    view.setUint16(5, port);
    this._push(message);
  }
  /**
  * Message: "suggest" <len=0x0005><id=0x0D><piece index> (BEP6)
  * @param {number} index
  */
  suggest(index) {
    if (!this.hasFast) throw Error("fast extension is disabled");
    this._debug("suggest %d", index);
    this._message(13, [index], null);
  }
  /**
  * Message: "have-all" <len=0x0001><id=0x0E> (BEP6)
  */
  haveAll() {
    if (!this.hasFast) throw Error("fast extension is disabled");
    this._debug("have-all");
    this._push(MESSAGE_HAVE_ALL);
  }
  /**
  * Message: "have-none" <len=0x0001><id=0x0F> (BEP6)
  */
  haveNone() {
    if (!this.hasFast) throw Error("fast extension is disabled");
    this._debug("have-none");
    this._push(MESSAGE_HAVE_NONE);
  }
  /**
  * Message "reject": <len=0x000D><id=0x10><index><offset><length> (BEP6)
  * @param  {number}   index
  * @param  {number}   offset
  * @param  {number}   length
  */
  reject(index, offset, length) {
    if (!this.hasFast) throw Error("fast extension is disabled");
    this._debug("reject index=%d offset=%d length=%d", index, offset, length);
    this._pull(this.peerRequests, index, offset, length);
    this._message(16, [index, offset, length], null);
  }
  /**
  * Message: "allowed-fast" <len=0x0005><id=0x11><piece index> (BEP6)
  * @param {number} index
  */
  allowedFast(index) {
    if (!this.hasFast) throw Error("fast extension is disabled");
    this._debug("allowed-fast %d", index);
    if (!this.allowedFastSet.includes(index)) this.allowedFastSet.push(index);
    this._message(17, [index], null);
  }
  /**
  * Message: "extended" <len=0005+X><id=20><ext-number><payload>
  * @param  {number|string} ext
  * @param  {Object} obj
  */
  extended(ext, obj) {
    this._debug("extended ext=%s", ext);
    if (typeof ext === "string" && this.peerExtendedMapping[ext]) {
      ext = this.peerExtendedMapping[ext];
    }
    if (typeof ext === "number") {
      const extId = new Uint8Array([ext]);
      const buf = ArrayBuffer.isView(obj) ? obj : import_bencode.default.encode(obj);
      this._message(20, [], (0, import_uint8_util.concat)([extId, buf]));
    } else {
      throw new Error(`Unrecognized extension: ${ext}`);
    }
  }
  /**
  * Sets the encryption method for this wire, as per PSE/ME specification
  *
  * @param {string} sharedSecret:  A hex-encoded string, which is the shared secret agreed
  *                                upon from DH key exchange
  * @param {string} infoHash:  A hex-encoded info hash
  * @returns boolean, true if encryption setting succeeds, false if it fails.
  */
  async setEncrypt(sharedSecret, infoHash) {
    let encryptKeyBuf;
    let encryptKeyIntArray;
    let decryptKeyBuf;
    let decryptKeyIntArray;
    switch (this.type) {
      case "tcpIncoming":
        encryptKeyBuf = await (0, import_uint8_util.hash)((0, import_uint8_util.hex2arr)(this._utfToHex("keyB") + sharedSecret + infoHash));
        decryptKeyBuf = await (0, import_uint8_util.hash)((0, import_uint8_util.hex2arr)(this._utfToHex("keyA") + sharedSecret + infoHash));
        encryptKeyIntArray = [];
        for (const value of encryptKeyBuf.values()) {
          encryptKeyIntArray.push(value);
        }
        decryptKeyIntArray = [];
        for (const value of decryptKeyBuf.values()) {
          decryptKeyIntArray.push(value);
        }
        this._encryptGenerator = new import_rc4.default(encryptKeyIntArray);
        this._decryptGenerator = new import_rc4.default(decryptKeyIntArray);
        break;
      case "tcpOutgoing":
        encryptKeyBuf = await (0, import_uint8_util.hash)((0, import_uint8_util.hex2arr)(this._utfToHex("keyA") + sharedSecret + infoHash));
        decryptKeyBuf = await (0, import_uint8_util.hash)((0, import_uint8_util.hex2arr)(this._utfToHex("keyB") + sharedSecret + infoHash));
        encryptKeyIntArray = [];
        for (const value of encryptKeyBuf.values()) {
          encryptKeyIntArray.push(value);
        }
        decryptKeyIntArray = [];
        for (const value of decryptKeyBuf.values()) {
          decryptKeyIntArray.push(value);
        }
        this._encryptGenerator = new import_rc4.default(encryptKeyIntArray);
        this._decryptGenerator = new import_rc4.default(decryptKeyIntArray);
        break;
      default:
        return false;
    }
    for (let i = 0; i < 1024; i++) {
      this._encryptGenerator.randomByte();
      this._decryptGenerator.randomByte();
    }
    this._setGenerators = true;
    return true;
  }
  /**
  * Send a message to the remote peer.
  */
  _message(id, numbers, data) {
    const dataLength = data ? data.length : 0;
    const buffer = new Uint8Array(5 + 4 * numbers.length);
    const view = new DataView(buffer.buffer);
    view.setUint32(0, buffer.length + dataLength - 4);
    buffer[4] = id;
    for (let i = 0; i < numbers.length; i++) {
      view.setUint32(5 + 4 * i, numbers[i]);
    }
    this._push(buffer);
    if (data) this._push(data);
  }
  _push(data) {
    if (this._finished) return;
    if (this._encryptionMethod === 2 && this._cryptoHandshakeDone) {
      data = this._encrypt(data);
    }
    return this.push(data);
  }
  //
  // INCOMING MESSAGES
  //
  _onKeepAlive() {
    this._debug("got keep-alive");
    this.emit("keep-alive");
  }
  _onPe1(pubKeyBuffer) {
    this._peerPubKey = (0, import_uint8_util.arr2hex)(pubKeyBuffer);
    this._sharedSecret = this._dh.computeSecret(this._peerPubKey, "hex", "hex");
    this.emit("pe1");
  }
  _onPe2(pubKeyBuffer) {
    this._peerPubKey = (0, import_uint8_util.arr2hex)(pubKeyBuffer);
    this._sharedSecret = this._dh.computeSecret(this._peerPubKey, "hex", "hex");
    this.emit("pe2");
  }
  async _onPe3(hashesXorBuffer) {
    const hash3 = await (0, import_uint8_util.arr2hex)(this._utfToHex("req3") + this._sharedSecret);
    const sKeyHash = (0, import_uint8_util.arr2hex)(xor(hash3, hashesXorBuffer));
    this.emit("pe3", sKeyHash);
  }
  _onPe3Encrypted(vcBuffer, peerProvideBuffer) {
    if (!(0, import_uint8_util.equal)(vcBuffer, VC)) {
      this._debug("Error: verification constant did not match");
      this.destroy();
      return;
    }
    for (const provideByte of peerProvideBuffer.values()) {
      if (provideByte !== 0) {
        this._peerCryptoProvide.push(provideByte);
      }
    }
    if (this._peerCryptoProvide.includes(2)) {
      this._encryptionMethod = 2;
    } else {
      this._debug("Error: RC4 encryption method not provided by peer");
      this.destroy();
    }
  }
  _onPe4(peerSelectBuffer) {
    this._encryptionMethod = peerSelectBuffer[3];
    if (!CRYPTO_PROVIDE.includes(this._encryptionMethod)) {
      this._debug("Error: peer selected invalid crypto method");
      this.destroy();
    }
    this._cryptoHandshakeDone = true;
    this._debug("crypto handshake done");
    this.emit("pe4");
  }
  _onHandshake(infoHashBuffer, peerIdBuffer, extensions) {
    const infoHash = (0, import_uint8_util.arr2hex)(infoHashBuffer);
    const peerId = (0, import_uint8_util.arr2hex)(peerIdBuffer);
    this._debug("got handshake i=%s p=%s exts=%o", infoHash, peerId, extensions);
    this.peerId = peerId;
    this.peerIdBuffer = peerIdBuffer;
    this.peerExtensions = extensions;
    if (this.extensions.fast && this.peerExtensions.fast) {
      this._debug("fast extension is enabled");
      this.hasFast = true;
    }
    this.emit("handshake", infoHash, peerId, extensions);
    for (const name in this._ext) {
      this._ext[name].onHandshake(infoHash, peerId, extensions);
    }
    if (extensions.extended && this._handshakeSent && !this._extendedHandshakeSent) {
      this._sendExtendedHandshake();
    }
  }
  _onChoke() {
    this.peerChoking = true;
    this._debug("got choke");
    this.emit("choke");
    if (!this.hasFast) {
      while (this.requests.length) {
        this._callback(this.requests.pop(), new Error("peer is choking"), null);
      }
    }
  }
  _onUnchoke() {
    this.peerChoking = false;
    this._debug("got unchoke");
    this.emit("unchoke");
  }
  _onInterested() {
    this.peerInterested = true;
    this._debug("got interested");
    this.emit("interested");
  }
  _onUninterested() {
    this.peerInterested = false;
    this._debug("got uninterested");
    this.emit("uninterested");
  }
  _onHave(index) {
    if (this.peerPieces.get(index)) return;
    this._debug("got have %d", index);
    this.peerPieces.set(index, true);
    this.emit("have", index);
  }
  _onBitField(buffer) {
    this.peerPieces = new import_bitfield.default(buffer);
    this._debug("got bitfield");
    this.emit("bitfield", this.peerPieces);
  }
  _onRequest(index, offset, length) {
    if (this.amChoking && !(this.hasFast && this.allowedFastSet.includes(index))) {
      if (this.hasFast) this.reject(index, offset, length);
      return;
    }
    this._debug("got request index=%d offset=%d length=%d", index, offset, length);
    const respond = /* @__PURE__ */ __name((err, buffer) => {
      if (request !== this._pull(this.peerRequests, index, offset, length)) return;
      if (err) {
        this._debug("error satisfying request index=%d offset=%d length=%d (%s)", index, offset, length, err.message);
        if (this.hasFast) this.reject(index, offset, length);
        return;
      }
      this.piece(index, offset, buffer);
    }, "respond");
    const request = new Request(index, offset, length, respond);
    this.peerRequests.push(request);
    this.emit("request", index, offset, length, respond);
  }
  _onPiece(index, offset, buffer) {
    this._debug("got piece index=%d offset=%d", index, offset);
    this._callback(this._pull(this.requests, index, offset, buffer.length), null, buffer);
    this.downloaded += buffer.length;
    this.downloadSpeed(buffer.length);
    this.emit("download", buffer.length);
    this.emit("piece", index, offset, buffer);
  }
  _onCancel(index, offset, length) {
    this._debug("got cancel index=%d offset=%d length=%d", index, offset, length);
    this._pull(this.peerRequests, index, offset, length);
    this.emit("cancel", index, offset, length);
  }
  _onPort(port) {
    this._debug("got port %d", port);
    this.emit("port", port);
  }
  _onSuggest(index) {
    if (!this.hasFast) {
      this._debug("Error: got suggest whereas fast extension is disabled");
      this.destroy();
      return;
    }
    this._debug("got suggest %d", index);
    this.emit("suggest", index);
  }
  _onHaveAll() {
    if (!this.hasFast) {
      this._debug("Error: got have-all whereas fast extension is disabled");
      this.destroy();
      return;
    }
    this._debug("got have-all");
    this.peerPieces = new HaveAllBitField();
    this.emit("have-all");
  }
  _onHaveNone() {
    if (!this.hasFast) {
      this._debug("Error: got have-none whereas fast extension is disabled");
      this.destroy();
      return;
    }
    this._debug("got have-none");
    this.emit("have-none");
  }
  _onReject(index, offset, length) {
    if (!this.hasFast) {
      this._debug("Error: got reject whereas fast extension is disabled");
      this.destroy();
      return;
    }
    this._debug("got reject index=%d offset=%d length=%d", index, offset, length);
    this._callback(
      this._pull(this.requests, index, offset, length),
      new Error("request was rejected"),
      null
    );
    this.emit("reject", index, offset, length);
  }
  _onAllowedFast(index) {
    if (!this.hasFast) {
      this._debug("Error: got allowed-fast whereas fast extension is disabled");
      this.destroy();
      return;
    }
    this._debug("got allowed-fast %d", index);
    if (!this.peerAllowedFastSet.includes(index)) this.peerAllowedFastSet.push(index);
    if (this.peerAllowedFastSet.length > ALLOWED_FAST_SET_MAX_LENGTH) this.peerAllowedFastSet.shift();
    this.emit("allowed-fast", index);
  }
  _onExtended(ext, buf) {
    if (ext === 0) {
      let info;
      try {
        info = import_bencode.default.decode(buf);
      } catch (err) {
        this._debug("ignoring invalid extended handshake: %s", err.message || err);
      }
      if (!info) return;
      this.peerExtendedHandshake = info;
      if (typeof info.m === "object") {
        for (const name in info.m) {
          this.peerExtendedMapping[name] = Number(info.m[name].toString());
        }
      }
      for (const name in this._ext) {
        if (this.peerExtendedMapping[name]) {
          this._ext[name].onExtendedHandshake(this.peerExtendedHandshake);
        }
      }
      this._debug("got extended handshake");
      this.emit("extended", "handshake", this.peerExtendedHandshake);
    } else {
      if (this.extendedMapping[ext]) {
        ext = this.extendedMapping[ext];
        if (this._ext[ext]) {
          this._ext[ext].onMessage(buf);
        }
      }
      this._debug("got extended message ext=%s", ext);
      this.emit("extended", ext, buf);
    }
  }
  _onTimeout() {
    this._debug("request timed out");
    this._callback(this.requests.shift(), new Error("request has timed out"), null);
    this.emit("timeout");
  }
  /**
  * Duplex stream method. Called whenever the remote peer has data for us. Data that the
  * remote peer sends gets buffered (i.e. not actually processed) until the right number
  * of bytes have arrived, determined by the last call to `this._parse(number, callback)`.
  * Once enough bytes have arrived to process the message, the callback function
  * (i.e. `this._parser`) gets called with the full buffer of data.
  * @param  {Uint8Array} data
  * @param  {function} cb
  */
  _write(data, cb) {
    if (this._encryptionMethod === 2 && this._cryptoHandshakeDone) {
      data = this._decrypt(data);
    }
    this._bufferSize += data.length;
    this._buffer.push(data);
    if (this._buffer.length > 1) {
      this._buffer = [(0, import_uint8_util.concat)(this._buffer, this._bufferSize)];
    }
    if (this._cryptoSyncPattern) {
      const index = this._buffer[0].indexOf(this._cryptoSyncPattern);
      if (index !== -1) {
        this._buffer[0] = this._buffer[0].slice(index + this._cryptoSyncPattern.length);
        this._bufferSize -= index + this._cryptoSyncPattern.length;
        this._cryptoSyncPattern = null;
      } else if (this._bufferSize + data.length > this._waitMaxBytes + this._cryptoSyncPattern.length) {
        this._debug("Error: could not resynchronize");
        this.destroy();
        return;
      }
    }
    while (this._bufferSize >= this._parserSize && !this._cryptoSyncPattern) {
      if (this._parserSize === 0) {
        this._parser(new Uint8Array());
      } else {
        const buffer = this._buffer[0];
        this._bufferSize -= this._parserSize;
        this._buffer = this._bufferSize ? [buffer.slice(this._parserSize)] : [];
        this._parser(buffer.slice(0, this._parserSize));
      }
    }
    cb(null);
  }
  _callback(request, err, buffer) {
    if (!request) return;
    this._resetTimeout(!this.peerChoking && !this._finished);
    request.callback(err, buffer);
  }
  _resetTimeout(setAgain) {
    if (!setAgain || !this._timeoutMs || !this.requests.length) {
      clearTimeout(this._timeout);
      this._timeout = null;
      this._timeoutExpiresAt = null;
      return;
    }
    const timeoutExpiresAt = Date.now() + this._timeoutMs;
    if (this._timeout) {
      if (timeoutExpiresAt - this._timeoutExpiresAt < this._timeoutMs * 0.05) {
        return;
      }
      clearTimeout(this._timeout);
    }
    this._timeoutExpiresAt = timeoutExpiresAt;
    this._timeout = setTimeout(() => this._onTimeout(), this._timeoutMs);
    if (this._timeoutUnref && this._timeout.unref) this._timeout.unref();
  }
  /**
  * Takes a number of bytes that the local peer is waiting to receive from the remote peer
  * in order to parse a complete message, and a callback function to be called once enough
  * bytes have arrived.
  * @param  {number} size
  * @param  {function} parser
  */
  _parse(size, parser) {
    this._parserSize = size;
    this._parser = parser;
  }
  _parseUntil(pattern, maxBytes) {
    this._cryptoSyncPattern = pattern;
    this._waitMaxBytes = maxBytes;
  }
  /**
  * Handle the first 4 bytes of a message, to determine the length of bytes that must be
  * waited for in order to have the whole message.
  * @param  {Uint8Array} buffer
  */
  _onMessageLength(buffer) {
    const length = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength).getUint32(0);
    if (length > 0) {
      this._parse(length, this._onMessage);
    } else {
      this._onKeepAlive();
      this._parse(4, this._onMessageLength);
    }
  }
  /**
  * Handle a message from the remote peer.
  * @param  {Uint8Array} buffer
  */
  _onMessage(buffer) {
    this._parse(4, this._onMessageLength);
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    switch (buffer[0]) {
      case 0:
        return this._onChoke();
      case 1:
        return this._onUnchoke();
      case 2:
        return this._onInterested();
      case 3:
        return this._onUninterested();
      case 4:
        return this._onHave(view.getUint32(1));
      case 5:
        return this._onBitField(buffer.slice(1));
      case 6:
        return this._onRequest(
          view.getUint32(1),
          view.getUint32(5),
          view.getUint32(9)
        );
      case 7:
        return this._onPiece(
          view.getUint32(1),
          view.getUint32(5),
          buffer.slice(9)
        );
      case 8:
        return this._onCancel(
          view.getUint32(1),
          view.getUint32(5),
          view.getUint32(9)
        );
      case 9:
        return this._onPort(view.getUint16(1));
      case 13:
        return this._onSuggest(view.getUint32(1));
      case 14:
        return this._onHaveAll();
      case 15:
        return this._onHaveNone();
      case 16:
        return this._onReject(
          view.getUint32(1),
          view.getUint32(5),
          view.getUint32(9)
        );
      case 17:
        return this._onAllowedFast(view.getUint32(1));
      case 20:
        return this._onExtended(buffer[1], buffer.slice(2));
      default:
        this._debug("got unknown message");
        return this.emit("unknownmessage", buffer);
    }
  }
  _determineHandshakeType() {
    this._parse(1, (pstrLenBuffer) => {
      const pstrlen = pstrLenBuffer[0];
      if (pstrlen === 19) {
        this._parse(pstrlen + 48, this._onHandshakeBuffer);
      } else {
        this._parsePe1(pstrLenBuffer);
      }
    });
  }
  _parsePe1(pubKeyPrefix) {
    this._parse(95, (pubKeySuffix) => {
      this._onPe1((0, import_uint8_util.concat)([pubKeyPrefix, pubKeySuffix]));
      this._parsePe3();
    });
  }
  _parsePe2() {
    this._parse(96, (pubKey) => {
      this._onPe2(pubKey);
      while (!this._setGenerators) {
      }
      this._parsePe4();
    });
  }
  // Handles the unencrypted portion of step 4
  async _parsePe3() {
    const hash1Buffer = await (0, import_uint8_util.hash)((0, import_uint8_util.hex2arr)(this._utfToHex("req1") + this._sharedSecret));
    this._parseUntil(hash1Buffer, 512);
    this._parse(20, (buffer) => {
      this._onPe3(buffer);
      while (!this._setGenerators) {
      }
      this._parsePe3Encrypted();
    });
  }
  _parsePe3Encrypted() {
    this._parse(14, (buffer) => {
      const vcBuffer = this._decryptHandshake(buffer.slice(0, 8));
      const peerProvideBuffer = this._decryptHandshake(buffer.slice(8, 12));
      const padCLen = new DataView(this._decryptHandshake(buffer.slice(12, 14)).buffer).getUint16(0);
      this._parse(padCLen, (padCBuffer) => {
        padCBuffer = this._decryptHandshake(padCBuffer);
        this._parse(2, (iaLenBuf) => {
          const iaLen = new DataView(this._decryptHandshake(iaLenBuf).buffer).getUint16(0);
          this._parse(iaLen, (iaBuffer) => {
            iaBuffer = this._decryptHandshake(iaBuffer);
            this._onPe3Encrypted(vcBuffer, peerProvideBuffer, padCBuffer, iaBuffer);
            const pstrlen = iaLen ? iaBuffer[0] : null;
            const protocol = iaLen ? iaBuffer.slice(1, 20) : null;
            if (pstrlen === 19 && (0, import_uint8_util.arr2text)(protocol) === "BitTorrent protocol") {
              this._onHandshakeBuffer(iaBuffer.slice(1));
            } else {
              this._parseHandshake();
            }
          });
        });
      });
    });
  }
  _parsePe4() {
    const vcBufferEncrypted = this._decryptHandshake(VC);
    this._parseUntil(vcBufferEncrypted, 512);
    this._parse(6, (buffer) => {
      const peerSelectBuffer = this._decryptHandshake(buffer.slice(0, 4));
      const padDLen = new DataView(this._decryptHandshake(buffer.slice(4, 6)).buffer).getUint16(0);
      this._parse(padDLen, (padDBuf) => {
        this._decryptHandshake(padDBuf);
        this._onPe4(peerSelectBuffer);
        this._parseHandshake(null);
      });
    });
  }
  /**
  * Reads the handshake as specified by the bittorrent wire protocol.
  */
  _parseHandshake() {
    this._parse(1, (buffer) => {
      const pstrlen = buffer[0];
      if (pstrlen !== 19) {
        this._debug("Error: wire not speaking BitTorrent protocol (%s)", pstrlen.toString());
        this.end();
        return;
      }
      this._parse(pstrlen + 48, this._onHandshakeBuffer);
    });
  }
  _onHandshakeBuffer(handshake) {
    const protocol = handshake.slice(0, 19);
    if ((0, import_uint8_util.arr2text)(protocol) !== "BitTorrent protocol") {
      this._debug("Error: wire not speaking BitTorrent protocol (%s)", (0, import_uint8_util.arr2text)(protocol));
      this.end();
      return;
    }
    handshake = handshake.slice(19);
    this._onHandshake(handshake.slice(8, 28), handshake.slice(28, 48), {
      dht: !!(handshake[7] & 1),
      // see bep_0005
      fast: !!(handshake[7] & 4),
      // see bep_0006
      extended: !!(handshake[5] & 16)
      // see bep_0010
    });
    this._parse(4, this._onMessageLength);
  }
  _onFinish() {
    this._finished = true;
    this.push(null);
    while (this.read()) {
    }
    clearInterval(this._keepAliveInterval);
    this._parse(Number.MAX_VALUE, () => {
    });
    while (this.peerRequests.length) {
      this.peerRequests.pop();
    }
    while (this.requests.length) {
      this._callback(this.requests.pop(), new Error("wire was closed"), null);
    }
  }
  _debug(...args) {
    args[0] = `[${this._debugId}] ${args[0]}`;
    debug(...args);
  }
  _pull(requests, piece, offset, length) {
    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      if (req.piece === piece && req.offset === offset && req.length === length) {
        (0, import_unordered_array_remove.default)(requests, i);
        return req;
      }
    }
    return null;
  }
  _encryptHandshake(buf) {
    const crypt = new Uint8Array(buf);
    if (!this._encryptGenerator) {
      this._debug("Warning: Encrypting without any generator");
      return crypt;
    }
    for (let i = 0; i < buf.length; i++) {
      const keystream = this._encryptGenerator.randomByte();
      crypt[i] = crypt[i] ^ keystream;
    }
    return crypt;
  }
  _encrypt(buf) {
    const crypt = new Uint8Array(buf);
    if (!this._encryptGenerator || this._encryptionMethod !== 2) {
      return crypt;
    }
    for (let i = 0; i < buf.length; i++) {
      const keystream = this._encryptGenerator.randomByte();
      crypt[i] = crypt[i] ^ keystream;
    }
    return crypt;
  }
  _decryptHandshake(buf) {
    const decrypt = new Uint8Array(buf);
    if (!this._decryptGenerator) {
      this._debug("Warning: Decrypting without any generator");
      return decrypt;
    }
    for (let i = 0; i < buf.length; i++) {
      const keystream = this._decryptGenerator.randomByte();
      decrypt[i] = decrypt[i] ^ keystream;
    }
    return decrypt;
  }
  _decrypt(buf) {
    const decrypt = new Uint8Array(buf);
    if (!this._decryptGenerator || this._encryptionMethod !== 2) {
      return decrypt;
    }
    for (let i = 0; i < buf.length; i++) {
      const keystream = this._decryptGenerator.randomByte();
      decrypt[i] = decrypt[i] ^ keystream;
    }
    return decrypt;
  }
  _utfToHex(str) {
    return (0, import_uint8_util.arr2hex)((0, import_uint8_util.text2arr)(str));
  }
}
var src_default = Wire;
//# sourceMappingURL=index.cjs.map
