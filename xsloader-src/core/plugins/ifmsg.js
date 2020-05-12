import U from "../../util/index.js";
const L = U.global.xsloader;

/**
{
	 cmd:{
		 selfclients:{//自己连接服务端的实例
			 id:Connector
		 },
		 server:Connector,//服务端
		 clients:{//作为服务端接收的客户端实例
			 id:Client
		 }
	}
 }
 */
const CONNS_MAP = {};

function doSendMessage(source, msg) {
	msg.__ifmsg = true;
	source.postMessage(msg, "*");
}

const MESSAGE_LISTENER = (event) => {
	let {
		data,
		source,
		origin,
	} = event;
	if (L.isObject(data) && data.__ifmsg === true) {
		let {
			cmd,
			fromid,
			toid,
			mdata,
			type,
			err,
		} = data;

		let obj = CONNS_MAP[cmd];
		if (!obj) {
			doSendMessage(source, {
				toid: fromid,
				cmd,
				type: "ignore"
			})
		} else {
			if (type == "connecting") { //客户端连接服务端
				if (!obj.server) {
					doSendMessage(source, {
						toid: fromid,
						cmd,
						type: "connecting-fail",
						err: "not a server,cmd=${cmd}"
					})
				} else {
					if (obj.clients[fromid]) {
						doSendMessage(source, {
							toid: fromid,
							cmd,
							type: "connecting-fail",
							err: `duplicate fromid[${fromid}],cmd=${cmd}`
						})
					} else {
						let client = new Client(cmd, source, origin, fromid);
						doSendMessage(source, {
							toid: fromid,
							cmd,
							type: "connect",
						})
						obj.server.onConnect(client, mdata);
					}
				}
			} else if () {

			}
		}
	}
};
let timer = null;

function startTimer() {
	if (timer) {
		clearInterval(timer);
	}

	timer = setInterval(() => {
		for (let cmd in CONNS_MAP) {
			let obj = CONNS_MAP[cmd];
			if (obj.server) {
				for (let id in obj.clients) {
					obj.clients[id].checkTimeout():
				}
			} else {
				for (let id in obj.selfclients) {
					obj.selfclients[id].checkTimeout():
				}
			}
		}
	}, parseInt(5 + Math.random() * 10) * 1000);
}

class Base {
	_cmd;
	_source;
	_id;
	_heartTimeout = 30 * 1000; //心跳超时时间
	_heartTime = 6 * 1000; //发送心跳的最小间隔
	_lastSendHeartTime = 0;
	_lastReceiveHeartTime = 0;
	constructor(cmd) {
		this._cmd = cmd;
		this._id = L.randId();
	}

	get cmd() {
		return this._cmd;
	}

	get source() {
		return this._source;
	}

	get id() {
		return this._id;
	}

	checkTimeout() {

	}
}


class Client extends Base {
	_origin;
	_fromid;
	//////////////////////
	_connected = false;
	_destroyed = false;
	_onConnect;
	constructor(cmd, source, origin, fromid) {
		super(cmd);
		this._source = source;
		this._origin = origin;
		this._fromid = fromid;
	}

	get origin() {
		return this._origin;
	}

	get fromid() {
		return this._fromid;
	}

	get connected() {
		return this._connected;
	}

	get destroyed() {
		return this._destroyed;
	}

	connect(conndata) {
		if (this.connected) {
			throw new Error("already connected!");
		} else if (this.destroyed) {
			throw new Error("destroyed!");
		} else if (!this.source) {
			throw new Error("no source!");
		} else {
			if (U.isEmptyObject(CONNS_MAP)) {
				window.addEventListener('message', MESSAGE_LISTENER);
				startTimer();
			}

			let msg = {
				fromid: this.id,
				cmd: this.cmd,
				type: "connecting",
				mdata: conndata
			};

			if (!CONNS_MAP[this.cmd]) {
				CONNS_MAP[this.cmd] = {
					selfclients: {}
				};
			}
			CONNS_MAP[this.cmd].selfclients[this.id] = this;
			doSendMessage(this.source, msg);
		}
	}
}


/**
 * 负责建立连接。
 */
class Server extends Base {
	_start;
	_destroyed = false;
	_onConnect;
	constructor(cmd, source, onConnect) {
		super(cmd);
		this._source = source;
		this._id = L.randId();
		this._onConnect = onConnect;
	}

	onConnect(client, conndata) {
		let onConn = this._onConnect || (fromid, source, origin, conndata, callback) => {
			//默认只允许同域
			let mine = location.protocol + "//" + location.host;
			callback(mine == origin, "default");
		};

		let callback = (isAccept, errOrConndata) => {
			if (isAccept) {
				let obj = CONNS_MAP[this._cmd];
				obj.clients[client.fromid] = client;
				doSendMessage(source, {
					fromid: this.id,
					toid: client.fromid,
					type: "connected",
					mdata: errOrConndata
				});
			} else {
				doSendMessage(source, {
					fromid: this.id,
					toid: client.fromid,
					type: "connected-fail",
					err: errOrConndata
				});
			}
		};
		onConn(client.fromid, client.source, client.origin, conndata, callback);
	}

	close() {
		if (this._destroyed) {
			throw new Error("destroyed!");
		} else {
			let obj = CONNS_MAP[this.cmd];
			if (!obj.server || obj.server != this) {
				throw new Error(`server cmd not match:cmd=${this.cmd}`);
			} else {
				delete CONNS_MAP[this.cmd];
				this._destroyed = true;
				this._start = false;
				for (let k in obj.clients) {
					try {
						let client = obj.clients[k];
						client.close();
					} catch (e) {
						console.error(e);
					}
				}
			}
		}
	}

	listen() {
		if (CONNS_MAP[this.cmd]) {
			throw new Error(`already listened:cmd=${this.cmd}`);
		} else {
			CONNS_MAP[this.cmd] = {
				server: this
			};
			this._start = true;
		}
	}

}


class IfmsgServer {
	_server;
	constructor() {

	}

	/**
	 *@param {Object} onConnect  function(fromid,source,origin,conndata,callback(isAccept,errOrConndata))
	 */
	set onConnect(onConnect) {
		this._server.onConnect = onConnect;
	}

	get onConnect() {
		return this._server.onConnect;
	}

	get isStart() {
		return this._server._start;
	}

	get isDestroyed() {
		return this._server._destroyed;
	}

	listen() {
		this._server.listen();
	}

	close() {
		this._server.close();
	}

}

class IfmsgClient {
	_client;
	constructor() {

	}

	connect(conndata) {

	}

	/**
	 *@param {Object} onConnect  function(fromid,source,origin,conndata,callback(isAccept,err))
	 */
	set onConnect(onConnect) {
		this._server.onConnect = onConnect;
	}

	get onConnect() {
		return this._server.onConnect;
	}

}

L.define("ifmsg", {
	server: IfmsgServer,
	client: IfmsgClient,
});
