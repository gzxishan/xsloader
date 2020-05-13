import U from "../../util/index.js";
const L = U.global.xsloader;

/**
{
	 cmd:{
		 selfclients:{//自己连接服务端的实例
			 id:Client
		 },
		 server:Connector,//服务端
		 clients:{//作为服务端接收的客户端实例
			 id:Client
		 }
	}
 }
 */
const CONNS_MAP = {};
const DEBUG_OPTION = {
	logMessage: false,
};

class Debug {
	constructor() {

	}

	set logMessage(log) {
		DEBUG_OPTION.logMessage = !!log;
	}

	get logMessage() {
		return DEBUG_OPTION.logMessage;
	}
}


function currentTimemillis() {
	return new Date().getTime();
}

function runAfter(time, callback) {
	return setTimeout(callback, time);
}

function clearRunAfter(timer) {
	clearTimeout(timer);
}

let timer = null;

function destroyTimer() {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
}

function startTimer() {
	destroyTimer();
	timer = setInterval(() => {
		for (let cmd in CONNS_MAP) {
			let obj = CONNS_MAP[cmd];
			for (let id in obj.clients) {
				obj.clients[id].checkHeart();
			}

			for (let id in obj.selfclients) {
				obj.selfclients[id].checkHeart();
			}
		}
	}, parseInt(5 + Math.random() * 10) * 1000);
}


function doSendMessage(isserver, source, msg) {
	msg = {
		isserver: !!isserver, //是否是服务端发送的
		...msg,
		__ifmsg: true,
	};
	try {
		source.postMessage(msg, "*");
	} catch (e) {
		console.error(e);
		console.error(msg);
	}
}

function checkSource(client, source) {
	if (client && client.source != source) { //防止其他窗口发过来
		throw new Error("source error:", client.source, source);
	}
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
			isserver,
		} = data;

		if (DEBUG_OPTION.logMessage) {
			console.log(location.href, " receive:");
			console.log(data);
		}

		let obj = CONNS_MAP[cmd];
		if (!obj) {
			if (type != "ignore") {
				doSendMessage(!isserver, source, {
					cmd,
					type: "ignore",
					toid: fromid,
					data,
				});
			}
		} else {
			if (type == "connecting") { //服务端
				if (!obj.server) {
					doSendMessage(!isserver, source, {
						cmd,
						type: "connecting-fail",
						toid: fromid,
						err: "not a server,cmd=${cmd}"
					});
				} else {
					if (obj.clients[fromid]) {
						if(currentTimemillis()-obj.clients[fromid]._createTime>10*1000){
							doSendMessage(!isserver, source, {
								cmd,
								type: "connecting-fail:duplicate",
								toid: fromid,
								err: `duplicate fromid[${fromid}],cmd=${cmd}`
							});
						}
					} else {
						let client = new Client(cmd, source, origin, fromid);
						client._conntimeout = obj.server._connTimeout;
						client._sleeptimeout = obj.server._sleepTimeout;
						doSendMessage(!isserver, source, {
							cmd,
							type: "connect",
							fromid: obj.server.id,
							toid: fromid,
						});
						obj.server.onConnect(client, mdata);
					}
				}
			} else if (type == "connecting-fail:duplicate") { //客户端
				console.warn(err);
			} else if (type == "connecting-fail") { //客户端
				let client = obj.selfclients[toid];
				checkSource(client, source);

				if (client) {
					client.gotConnectingFail(err);
				} else {
					console.warn(err);
				}
			} else if (type == "connect") { //客户端
				let client = obj.selfclients[toid];
				checkSource(client, source);

				if (!client) {
					doSendMessage(!isserver, source, {
						cmd,
						type: "connect-fail",
						toid: fromid,
						fromid: toid,
						err: `client not found:clientid=${toid}`
					});
				}

			} else if (type == "connect-fail") { //服务端
				console.warn(err);
			} else if (type == "connected") {
				let client;
				if (isserver) { //来自服务端
					client = obj.selfclients[toid];
				} else {
					client = obj.clients[fromid];
				}

				checkSource(client, source);

				if (client) {
					if (isserver) { //来自服务端
						client.gotConnect(fromid, source, origin, mdata);
					}
				}
			} else if (type == "message") {
				let client;
				if (isserver) { //来自服务端
					client = obj.selfclients[toid];
				} else {
					client = obj.clients[fromid];
				}

				checkSource(client, source);

				if (client) {
					if (isserver) { //来自服务端
						client.gotMessage(mdata);
					} else {
						client.gotMessage(mdata);
					}
				}
			} else if (type == "close") {
				let client;
				if (isserver) { //来自服务端
					client = obj.selfclients[toid];
				} else {
					client = obj.clients[fromid];
				}

				checkSource(client, source);

				if (client) {
					client.close();
				}
			} else if (type == "closed") {
				let client;
				if (isserver) { //来自服务端
					client = obj.selfclients[toid];
				} else {
					client = obj.clients[fromid];
				}

				checkSource(client, source);

				if (client) {
					client.close(false);
				}
			} else if (type == "heart") {
				let client;
				if (isserver) { //来自服务端
					client = obj.selfclients[toid];
				} else {
					client = obj.clients[fromid];
				}

				checkSource(client, source);

				if (client) {
					client.gotHeart();
					doSendMessage(!isserver, source, {
						cmd,
						type: "rheart",
						toid: fromid,
						fromid: toid,
					});
				}
			} else if (type == "rheart") {
				let client;
				if (isserver) { //来自服务端
					client = obj.selfclients[toid];
				} else {
					client = obj.clients[fromid];
				}

				checkSource(client, source);

				if (client) {
					client.gotHeart();
				}
			}
		}
	}
};

class Callback {
	thiz;
	callback;
	constructor(thiz, callback) {
		this.thiz = thiz;
		this.callback = callback;
	}

	invoke(args) {
		this.callback.apply(this.thiz, args);
	}
}

Callback.call = function(self, callback) {
	if (callback) {

		let args = [];
		for (var i = 2; i < arguments.length; i++) {
			args.push(arguments[i]);
		}

		if (callback instanceof Callback) {
			callback.invoke(args);
		} else {
			callback.apply(self, args);
		}
	}
};

class Base {
	_cmd;
	_id;
	constructor(cmd = "default") {
		this._cmd = cmd;
		this._id = L.randId();
	}

	get cmd() {
		return this._cmd;
	}

	get id() {
		return this._id;
	}

	closeBase() {
		let obj = CONNS_MAP[this.cmd];
		if (obj) {
			if (!obj.server && U.isEmptyObject(obj.clients) && U.isEmptyObject(obj.selfclients)) {
				delete CONNS_MAP[this.cmd];
				if (U.isEmptyObject(CONNS_MAP)) {
					window.removeEventListener('message', MESSAGE_LISTENER);
					destroyTimer();
				}
			}
		}
	}
}


class Client extends Base {
	_source;
	_origin;
	_fromid;
	//////////////////////
	_connect;
	_connected = false;
	_destroyed = false;
	_onConnect;
	_onConnectFail;
	_isself;
	_conntimeout;
	_sleeptimeout;
	_rtimer;
	_starttime;
	_failed;
	////////////////
	_heartTimeout = 30 * 1000; //心跳超时时间
	_heartTime = 10 * 1000; //发送心跳的最小间隔
	_lastSendHeartTime = 0;
	_lastReceiveHeartTime = 0;
	_onHeartTimeout;
	_onClosed;
	_onMessage;
	_onConnected;
	_createTime=currentTimemillis();
	constructor(cmd, source, origin, fromid, isself = false) {
		super(cmd);
		this._source = source;
		this._origin = origin;
		this._fromid = fromid;
		this._isself = isself;
	}

	get source() {
		return this._source;
	}

	set source(source) {
		if (this._source) {
			throw new Error(`already exists source:id=${this.id}`);
		}

		this._source = source;
	}

	get isself() {
		return this._isself;
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

	isTimeout() {
		let dt = currentTimemillis() - this._starttime;
		return dt > this._conntimeout;
	}

	connect(conndata) {
		if (!this.isself) {
			throw new Error("not allowed for server client!");
		} else if (this.connected) {
			//throw new Error("already connected!");
		} else if (this.destroyed) {
			throw new Error("destroyed!");
		} else if (!this.source) {
			throw new Error("no source!");
		} else {
			if (!this._starttime || this._failed) {
				this._failed = false;
				this._starttime = currentTimemillis();
				this._connect = false;
			} else if (this._connect) {
				return;
			}

			if (U.isEmptyObject(CONNS_MAP)) {
				window.addEventListener('message', MESSAGE_LISTENER);
				startTimer();
			}

			let msg = {
				cmd: this.cmd,
				type: "connecting",
				fromid: this.id,
				mdata: conndata
			};

			if (!CONNS_MAP[this.cmd]) {
				CONNS_MAP[this.cmd] = {
					server: null,
					clients: {},
					selfclients: {}
				};
			}
			CONNS_MAP[this.cmd].selfclients[this.id] = this;
			doSendMessage(false, this.source, msg);

			this._rtimer = runAfter(this._sleeptimeout, () => {
				if (this.connected || this._failed || this._connect || this._destroyed) {
					return;
				} else if (this.isTimeout()) {
					if (!this.connected) {
						this._failed = true;
						Callback.call(this, this._onConnectFail, {
							cmd: this.cmd,
							type: "timeout:connecting"
						});
					}
				} else {
					this.connect(conndata);
				}
			});
		}
	}

	checkHeart() {
		if (this.connected && !this._destroyed) {
			let time = currentTimemillis();
			if (time - this._lastReceiveHeartTime > this._heartTimeout) {
				try {
					Callback.call(this, this._onHeartTimeout);
				} finally {
					this.close();
				}
			} else if (time - this._lastSendHeartTime > this._heartTime) {
				this._lastSendHeartTime = time;
				doSendMessage(!this.isself, this.source, {
					cmd: this.cmd,
					type: "heart",
					fromid: this.id,
					toid: this.fromid
				});
			}
		}
	}

	gotHeart() {
		this._lastReceiveHeartTime = currentTimemillis();
	}

	//服务端调用
	checkClientConnected(server) {
		if (!this._connected && !this._destroyed && !this._failed) {
			if (!this._starttime) {
				this._starttime = currentTimemillis();
				this._connect = true;
			}

			if (this.isTimeout()) {
				try {
					Callback.call(this, server._onConnectTimeout, this);
				} finally {
					this.close();
				}
			} else {
				this._rtimer = runAfter(this._sleeptimeout, () => {
					this.checkClientConnected(server);
				});
			}
		}
	}

	gotConnectingFail(err) {
		this._failed = true;
		Callback.call(this, this._onConnectFail, {
			cmd: this.cmd,
			type: "fail:connecting",
			err,
		});
	}
	//客户端调用
	gotConnect(fromid, source, origin, conndata) {
		this._fromid=fromid;
		if (!this._connect && !this._connected && !this._destroyed && !this._failed) {
			this._connect = true;
			let onConn = this._onConnect || ((source, origin, conndata, callback) => {
				//默认只允许同域
				let mine = location.protocol + "//" + location.host;
				callback(mine == origin, null);
			});

			let callback = (isAccept, errOrConndata) => {
				if (isAccept) {
					this.gotConnected();
					doSendMessage(false, this.source, {
						cmd: this.cmd,
						type: "connected",
						fromid: this.id,
						toid: this.fromid,
					});
					let onConnected = this._onConnected || (() => {
						this.close(false);
						doSendMessage(true, this.source, {
							cmd: this.cmd,
							type: "close",
							mdata: "not exists connected handle",
							fromid: this.id,
							toid: this.fromid,
						});
					});
					Callback.call(this, onConnected);
				} else {
					doSendMessage(false, this.source, {
						cmd: this.cmd,
						type: "connected-fail",
						err: errOrConndata,
						fromid: this.id,
						toid: this.fromid,
					});
				}
			};
			Callback.call(this, onConn, source, origin, conndata, callback);
		}
	}

	gotConnected() {
		clearRunAfter(this._rtimer);
		this._rtimer = null;
		
		let time = currentTimemillis();
		this._lastSendHeartTime = time;
		this._lastReceiveHeartTime = time;
		this._connected = true;
	}

	gotMessage(mdata) {
		Callback.call(this, this._onMessage, mdata);
	}

	close(sendClosed = true) {
		try {
			let obj = CONNS_MAP[this.cmd];
			if (obj) {
				if (this.isself) {
					if (obj.selfclients) {
						delete obj.selfclients[this.id];
					}
				} else {
					if (obj.clients) {
						delete obj.clients[this.fromid];
					}
				}
			}

			if (this._rtimer) {
				clearRunAfter(this._rtimer);
				this._rtimer = null;
			}

			this._connected = false;
			this._destroyed = true;
			this.closeBase();

			if (sendClosed && this.source) {
				doSendMessage(!this.isself, this.source, {
					cmd: this.cmd,
					type: "closed",
					fromid: this.id,
					toid: this.fromid
				});
			}
		} finally {
			Callback.call(this, this._onClosed);
		}
	}

	/**
	 * @param {Function} onHeartTimeout
	 */
	set onHeartTimeout(onHeartTimeout) {
		this._onHeartTimeout = onHeartTimeout ? new Callback(this, onHeartTimeout) : null;
	}

	get onHeartTimeout() {
		return this._onHeartTimeout && this._onHeartTimeout.callback;
	}

	/**
	 * @param {Function} onHeartTimeout
	 */
	set onClosed(onClosed) {
		this._onClosed = onClosed ? new Callback(this, onClosed) : null;
	}

	get onClosed() {
		return this._onClosed && this._onClosed.callback;
	}

	/**
	 * @param {Function} onMessage funcation(data)
	 */
	set onMessage(onMessage) {
		this._onMessage = onMessage ? new Callback(this, onMessage) : null;
	}

	get onMessage() {
		return this._onMessage && this._onMessage.callback;
	}

	sendMessage(data) {
		if (this.destroyed) {
			throw new Error("destroyed!");
		} else if (this.connected) {
			doSendMessage(!this.isself, this.source, {
				cmd: this.cmd,
				type: "message",
				mdata: data,
				fromid: this.id,
				toid: this.fromid
			});
		} else {
			throw new Error("not connected!");
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
	_onConnectTimeout;
	_onConnected;
	_conntimeout;
	_sleeptimeout;
	constructor(cmd) {
		super(cmd);
		this._id = L.randId();
		this.onConnectTimeout = (client) => {
			console.warn("client connect timeout:", client);
		};
	}

	onConnect(client, conndata) {
		let onConn = this._onConnect || ((client, conndata, callback) => {
			//默认只允许同域
			let mine = location.protocol + "//" + location.host;
			callback(mine == client.origin, null);
		});

		let callback = (isAccept, errOrConndata) => {
			if (isAccept) {
				let obj = CONNS_MAP[this.cmd];
				obj.clients[client.fromid] = client;
				client.gotConnected();
				doSendMessage(true, client.source, {
					cmd: this.cmd,
					type: "connected",
					mdata: errOrConndata,
					fromid: this.id,
					toid: client.fromid,
				});
				let onConnected = this._onConnected || (() => {
					client.close(false);
					doSendMessage(true, client.source, {
						cmd: this.cmd,
						type: "close",
						mdata: "not exists connected handle",
						fromid: this.id,
						toid: client.fromid,
					});
				});
				Callback.call(this, onConnected, client);
				client.checkClientConnected(this);
			} else {
				doSendMessage(true, client.source, {
					cmd: this.cmd,
					type: "connected-fail",
					err: errOrConndata,
					fromid: this.id,
					toid: client.fromid,
				});
			}
		};
		Callback.call(this, onConn, client, conndata, callback);
	}

	close() {
		if (this._destroyed) {
			throw new Error("already destroyed!");
		} else {
			let obj = CONNS_MAP[this.cmd];
			if (!obj.server || obj.server != this) {
				throw new Error(`server cmd not match:cmd=${this.cmd}`);
			} else {
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
				obj.clients = {};
				obj.server = null;
				this.closeBase();
			}
		}
	}

	listen() {
		if (CONNS_MAP[this.cmd]) {
			throw new Error(`already listened:cmd=${this.cmd}`);
		} else {
			if (U.isEmptyObject(CONNS_MAP)) {
				window.addEventListener('message', MESSAGE_LISTENER);
				startTimer();
			}

			if (!CONNS_MAP[this.cmd]) {
				CONNS_MAP[this.cmd] = {
					server: null,
					clients: {},
					selfclients: {}
				};
			}
			CONNS_MAP[this.cmd].server = this;
			this._start = true;
		}
	}

}


class IfmsgServer {
	_server;
	constructor(cmd, option) {
		const gconfig = L.config().plugins.ifmsg;
		option = L.extend({
			connTimeout: gconfig.connTimeout,
			sleepTimeout: gconfig.sleepTimeout,
		}, option);

		this._server = new Server(cmd);
		this._server._conntimeout = option.connTimeout;
		this._server._sleeptimeout = option.sleepTimeout;
	}

	/**
	 *@param {Function} onConnect  function(client,conndata,callback(isAccept,errOrConndata))
	 */
	set onConnect(onConnect) {
		this._server._onConnect = onConnect ? new Callback(this, onConnect) : null;
	}

	get onConnect() {
		return this._server._onConnect && this._server._onConnect.callback;
	}

	/**
	 * @param {Function} onConnectTimeout function(client)
	 */
	set onConnectTimeout(onConnectTimeout) {
		this._server._onConnectTimeout = onConnectTimeout ? new Callback(this, onConnectTimeout) : null;
	}

	get onConnectTimeout() {
		return this._server._onConnectTimeout && this._server._onConnectTimeout.callback;
	}

	/**
	 * @param {Function} onConnected function(client)
	 */
	set onConnected(onConnected) {
		this._server._onConnected = onConnected ? new Callback(this, onConnected) : null;
	}

	get onConnected() {
		return this._server._onConnected && this._server._onConnected.callback;
	}

	get isStart() {
		return this._server._start;
	}

	get isDestroyed() {
		return this._server._destroyed;
	}

	get cmd() {
		return this._server.cmd;
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
	constructor(cmd, option) {
		const gconfig = L.config().plugins.ifmsg;
		option = L.extend({
			connTimeout: gconfig.connTimeout,
			sleepTimeout: gconfig.sleepTimeout,
		}, option);

		this._client = new Client(cmd, null, null, null, true);
		this._client._conntimeout = option.connTimeout;
		this._client._sleeptimeout = option.sleepTimeout;
		this.onConnectFail = (err) => {
			console.warn(err);
		};
	}

	connIframe(iframe, conndata) {
		let winObj;
		if (typeof iframe == "string") {
			iframe = document.getElementById(iframe);
			let fun = () => {
				iframe.removeEventListener("load", fun);
				let source = iframe.contentWindow;
				this._client.source = source;
				this._client.connect(conndata);
			};
			iframe.addEventListener("load", fun);
		} else {
			let source = iframe.contentWindow;
			this._client.source = source;
			this._client.connect(conndata);
		}
	}

	connParent(conndata) {
		this._client.source = window.parent;
		this._client.connect(conndata);
	}

	connTop(conndata) {
		this._client.source = window.top;
		this._client.connect(conndata);
	}

	connOpener(conndata) {
		this._client.source = window.opener;
		this._client.connect(conndata);
	}

	/**
	 *@param {Function} onConnect  function(source,origin,conndata,callback(isAccept,err))
	 */
	set onConnect(onConnect) {
		this._client._onConnect = onConnect ? new Callback(this, onConnect) : null;
	}

	get onConnect() {
		return this._client._onConnect && this._client._onConnect.callback;
	}

	/**
	 *@param {Function} onConnected
	 */
	set onConnected(onConnected) {
		this._client._onConnected = onConnected ? new Callback(this, onConnected) : null;
	}

	get onConnected() {
		return this._client._onConnected && this._client._onConnected.callback;
	}

	sendMessage(data) {
		this._client.sendMessage(data);
	}

	/**
	 * @param {Function} onHeartTimeout
	 */
	set onHeartTimeout(onHeartTimeout) {
		this._client.onHeartTimeout = onHeartTimeout;
	}

	get onHeartTimeout() {
		return this._client.onHeartTimeout;
	}

	/**
	 * @param {Function} onHeartTimeout
	 */
	set onClosed(onClosed) {
		this._client.onClosed = onClosed;
	}

	get onClosed() {
		return this._client.onClosed;
	}

	/**
	 * @param {Function} onMessage funcation(data)
	 */
	set onMessage(onMessage) {
		this._client.onMessage = onMessage;
	}

	get onMessage() {
		return this._client.onMessage;
	}

	/**
	 * @param {Function} callback function(err)
	 */
	set onConnectFail(callback) {
		this._client._onConnectFail = callback ? new Callback(this, callback) : null;
	}

	get onConnectFail() {
		return this._client._onConnectFail && this._client._onConnectFail.callback;
	}

}

L.define("ifmsg", {
	Server: IfmsgServer,
	Client: IfmsgClient,
	debug: new Debug(),
});
