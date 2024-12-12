import BitField from 'bitfield';
import { Duplex } from 'streamx';
declare class Wire extends Duplex {
    _debugId: string;
    peerId: null | string;
    peerIdBuffer: null | Uint8Array;
    type: 'webrtc' | 'tcpIncoming' | 'tcpOutgoing' | 'webSeed' | null;
    amChoking: boolean;
    amInterested: boolean;
    peerChoking: boolean;
    peerInterested: boolean;
    _dh: any;
    _myPubKey: null | string;
    _setGenerators: boolean;
    _decryptGenerator: any;
    _encryptGenerator: any;
    _encryptMethod: any;
    _waitMaxBytes: number;
    _cryptoSyncPattern: any;
    _peerPubKey: any;
    _sharedSecret: any;
    _cryptoHandshakeDone: boolean;
    _peerCryptoProvide: any;
    peerPieces: InstanceType<typeof BitField>;
    extensions: Record<string, any>;
    peerExtensions: Record<string, any>;
    requests: any[];
    peerRequests: any[];
    extendedMapping: Record<number, string>;
    peerExtendedMapping: Record<string, number>;
    peerExtendedHandshake: any;
    extendedHandshake: {};
    hasFast: boolean;
    allowedFastSet: any;
    peerAllowedFastSet: any;
    _ext: Record<string, (any: any) => any>;
    _nextExt: number;
    uploaded: number;
    downloaded: number;
    uploadSpeed: number;
    downloadSpeed: number;
    _keepAliveInterval: null;
    _timeout: null;
    _timeoutMs: number;
    _timeoutExpiresAt: null;
    _finished: boolean;
    _parserSize: number;
    _parser: any;
    _buffer: any;
    _bufferSize: number;
    _peEnabled: boolean;
    constructor(type?: null, retries?: number, peEnabled?: boolean);
    /**
   * Set whether to send a "keep-alive" ping (sent every 55s)
   * @param {boolean} enable
   */
    setKeepAlive(enable: any): void;
    /**
   * Set the amount of time to wait before considering a request to be "timed out"
   * @param {number} ms
   * @param {boolean=} unref (should the timer be unref'd? default: false)
   */
    setTimeout(ms: any, unref: any): void;
    destroy(): this | undefined;
    end(data: any): any;
    /**
   * Use the specified protocol extension.
   * @param  {function} Extension
   */
    use(Extension: any): void;
    /**
   * Message "keep-alive": <len=0000>
   */
    keepAlive(): void;
    sendPe1(): void;
    sendPe2(): void;
    sendPe3(infoHash: any): Promise<void>;
    sendPe4(infoHash: any): Promise<void>;
    /**
   * Message: "handshake" <pstrlen><pstr><reserved><info_hash><peer_id>
   * @param  {Uint8Array|string} infoHash (as Buffer or *hex* string)
   * @param  {Uint8Array|string} peerId
   * @param  {Object} extensions
   */
    handshake(infoHash: any, peerId: any, extensions: any): void;
    _sendExtendedHandshake(): void;
    /**
   * Message "choke": <len=0001><id=0>
   */
    choke(): void;
    /**
   * Message "unchoke": <len=0001><id=1>
   */
    unchoke(): void;
    /**
   * Message "interested": <len=0001><id=2>
   */
    interested(): void;
    /**
   * Message "uninterested": <len=0001><id=3>
   */
    uninterested(): void;
    /**
   * Message "have": <len=0005><id=4><piece index>
   * @param  {number} index
   */
    have(index: any): void;
    /**
   * Message "bitfield": <len=0001+X><id=5><bitfield>
   * @param  {BitField|Buffer} bitfield
   */
    bitfield(bitfield: any): void;
    /**
   * Message "request": <len=0013><id=6><index><begin><length>
   * @param  {number}   index
   * @param  {number}   offset
   * @param  {number}   length
   * @param  {function} cb
   */
    request(index: any, offset: any, length: any, cb: any): any;
    /**
   * Message "piece": <len=0009+X><id=7><index><begin><block>
   * @param  {number} index
   * @param  {number} offset
   * @param  {Uint8Array} buffer
   */
    piece(index: any, offset: any, buffer: any): void;
    /**
   * Message "cancel": <len=0013><id=8><index><begin><length>
   * @param  {number} index
   * @param  {number} offset
   * @param  {number} length
   */
    cancel(index: any, offset: any, length: any): void;
    /**
   * Message: "port" <len=0003><id=9><listen-port>
   * @param {Number} port
   */
    port(port: any): void;
    /**
   * Message: "suggest" <len=0x0005><id=0x0D><piece index> (BEP6)
   * @param {number} index
   */
    suggest(index: any): void;
    /**
   * Message: "have-all" <len=0x0001><id=0x0E> (BEP6)
   */
    haveAll(): void;
    /**
   * Message: "have-none" <len=0x0001><id=0x0F> (BEP6)
   */
    haveNone(): void;
    /**
   * Message "reject": <len=0x000D><id=0x10><index><offset><length> (BEP6)
   * @param  {number}   index
   * @param  {number}   offset
   * @param  {number}   length
   */
    reject(index: any, offset: any, length: any): void;
    /**
   * Message: "allowed-fast" <len=0x0005><id=0x11><piece index> (BEP6)
   * @param {number} index
   */
    allowedFast(index: any): void;
    /**
   * Message: "extended" <len=0005+X><id=20><ext-number><payload>
   * @param  {number|string} ext
   * @param  {Object} obj
   */
    extended(ext: any, obj: any): void;
    /**
   * Sets the encryption method for this wire, as per PSE/ME specification
   *
   * @param {string} sharedSecret:  A hex-encoded string, which is the shared secret agreed
   *                                upon from DH key exchange
   * @param {string} infoHash:  A hex-encoded info hash
   * @returns boolean, true if encryption setting succeeds, false if it fails.
   */
    setEncrypt(sharedSecret: any, infoHash: any): Promise<boolean>;
    /**
   * Send a message to the remote peer.
   */
    _message(id: any, numbers: any, data: any): void;
    _push(data: any): any;
    _onKeepAlive(): void;
    _onPe1(pubKeyBuffer: any): void;
    _onPe2(pubKeyBuffer: any): void;
    _onPe3(hashesXorBuffer: any): Promise<void>;
    _onPe3Encrypted(vcBuffer: any, peerProvideBuffer: any): void;
    _onPe4(peerSelectBuffer: any): void;
    _onHandshake(infoHashBuffer: any, peerIdBuffer: any, extensions: any): void;
    _onChoke(): void;
    _onUnchoke(): void;
    _onInterested(): void;
    _onUninterested(): void;
    _onHave(index: any): void;
    _onBitField(buffer: any): void;
    _onRequest(index: any, offset: any, length: any): void;
    _onPiece(index: any, offset: any, buffer: any): void;
    _onCancel(index: any, offset: any, length: any): void;
    _onPort(port: any): void;
    _onSuggest(index: any): void;
    _onHaveAll(): void;
    _onHaveNone(): void;
    _onReject(index: any, offset: any, length: any): void;
    _onAllowedFast(index: any): void;
    _onExtended(ext: any, buf: any): void;
    _onTimeout(): void;
    /**
   * Duplex stream method. Called whenever the remote peer has data for us. Data that the
   * remote peer sends gets buffered (i.e. not actually processed) until the right number
   * of bytes have arrived, determined by the last call to `this._parse(number, callback)`.
   * Once enough bytes have arrived to process the message, the callback function
   * (i.e. `this._parser`) gets called with the full buffer of data.
   * @param  {Uint8Array} data
   * @param  {function} cb
   */
    _write(data: any, cb: any): void;
    _callback(request: any, err: any, buffer: any): void;
    _resetTimeout(setAgain: any): void;
    /**
   * Takes a number of bytes that the local peer is waiting to receive from the remote peer
   * in order to parse a complete message, and a callback function to be called once enough
   * bytes have arrived.
   * @param  {number} size
   * @param  {function} parser
   */
    _parse(size: any, parser: any): void;
    _parseUntil(pattern: any, maxBytes: any): void;
    /**
   * Handle the first 4 bytes of a message, to determine the length of bytes that must be
   * waited for in order to have the whole message.
   * @param  {Uint8Array} buffer
   */
    _onMessageLength(buffer: any): void;
    /**
   * Handle a message from the remote peer.
   * @param  {Uint8Array} buffer
   */
    _onMessage(buffer: any): any;
    _determineHandshakeType(): void;
    _parsePe1(pubKeyPrefix: any): void;
    _parsePe2(): void;
    _parsePe3(): Promise<void>;
    _parsePe3Encrypted(): void;
    _parsePe4(): void;
    /**
   * Reads the handshake as specified by the bittorrent wire protocol.
   */
    _parseHandshake(): void;
    _onHandshakeBuffer(handshake: any): void;
    _onFinish(): void;
    _debug(...args: any[]): void;
    _pull(requests: any, piece: any, offset: any, length: any): any;
    _encryptHandshake(buf: any): Uint8Array<any>;
    _encrypt(buf: any): Uint8Array<any>;
    _decryptHandshake(buf: any): Uint8Array<any>;
    _decrypt(buf: any): Uint8Array<any>;
    _utfToHex(str: any): string;
}
export default Wire;
//# sourceMappingURL=index.d.ts.map