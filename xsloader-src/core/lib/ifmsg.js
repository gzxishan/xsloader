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
		console.error("source error:", client.source, source);
		throw new Error("source error:not match");
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
						if (currentTimemillis() - obj.clients[fromid]._createTime > 10 * 1000) {
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

				//!!!!!source为空，可能为假冒页面？，关闭时不应直接执行安全相关操作
				source && checkSource(client, source);

				if (client) {
					client.close(false, undefined, mdata);
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
		return this.callback.apply(this.thiz, args);
	}
}

Callback.call = function(self, callback) {
	if (callback) {

		let args = [];
		for (var i = 2; i < arguments.length; i++) {
			args.push(arguments[i]);
		}

		if (callback instanceof Callback) {
			return callback.invoke(args);
		} else {
			return callback.apply(self, args);
		}
	}
};


let autoClosablesOnWindowClose = {};
//页面关闭时，发送关闭消息
window.addEventListener('beforeunload', (event) => {
	let as = autoClosablesOnWindowClose;
	autoClosablesOnWindowClose = {};
	let evt = {
		type: "beforeunload",
	};

	for (let id in as) {
		try {
			let closable = as[id];
			let data = closable.getUnloadData({
				...evt
			});
			closable.close(true, {
				...evt,
				data,
			});
		} catch (e) {
			console.warn(e);
		}
	}
});

window.addEventListener('unload', (event) => {
	let as = autoClosablesOnWindowClose;
	autoClosablesOnWindowClose = {};

	let evt = {
		type: "unload",
	};

	for (let id in as) {
		try {
			let closable = as[id];
			let data = closable.getUnloadData({
				...evt
			});
			closable.close(true, {
				...evt,
				data,
			});
		} catch (e) {
			console.warn(e);
		}
	}
});

function autoCloseOnWindowClose(closable) {
	let id = L.randId();
	autoClosablesOnWindowClose[id] = closable;
	return () => {
		delete autoClosablesOnWindowClose[id];
	}
}

class Base {
	_cmd;
	_id;
	///#onclose;
	constructor(cmd = "default") {
		this._cmd = cmd;
		this._id = L.randId();
		this.#onclose = autoCloseOnWindowClose(this);
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

		if (this.#onclose) {
			this.#onclose();
			this.#onclose = null;
		}
	}
}


class Client extends Base {
	///#source;
	_origin;
	_fromid;
	//////////////////////
	_connect;
	_connected = false;
	_destroyed = false;
	_onConnect;
	_onConnectFail;
	///#isself;//为false，则表示服务端连接得到的客户端
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
	_onUnload;
	_onClosed;
	_onMessage;
	_onConnected;
	_createTime = currentTimemillis();
	constructor(cmd, source, origin, fromid, isself = false) {
		super(cmd);
		this.#source = source;
		this._origin = origin;
		this._fromid = fromid;
		this.#isself = isself;
	}

	get source() {
		return this.#source;
	}

	set source(source) {
		if (this.#source) {
			throw new Error(`already exists source:id=${this.id}`);
		}

		this.#source = source;
	}

	get isself() {
		return this.#isself;
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
		this._fromid = fromid;
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
					let onConnected = this._onConnected;
					// || (() => {
					// 	this.close(false);
					// 	doSendMessage(true, this.source, {
					// 		cmd: this.cmd,
					// 		type: "close",
					// 		mdata: "not exists connected handle",
					// 		fromid: this.id,
					// 		toid: this.fromid,
					// 	});
					// });
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

	getUnloadData(e) {
		if (this.connected) {
			return Callback.call(this, this._onUnload, e);
		}
	}

	close(sendClosed = true, closeMessage, recvMessage) {
		if (this.connected) {
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
						mdata: closeMessage,
						fromid: this.id,
						toid: this.fromid
					});
				}
			} finally {
				Callback.call(this, this._onClosed, recvMessage);
			}
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
	 * @param {Function} onUnload(e) 返回的结果用于发送给对方
	 */
	set onUnload(onUnload) {
		this._onUnload = onUnload ? new Callback(this, onUnload) : null;
	}

	get onUnload() {
		return this._onUnload && this._onUnload.callback;
	}

	/**
	 * @param {Function} onClosed(data)
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
	///#singleMode;
	///#singleClient;//用于单例模式
	constructor(cmd, singleMode) {
		super(cmd);
		this.#singleMode = singleMode;
		this._id = L.randId();
		this.onConnectTimeout = (client) => {
			console.warn("client connect timeout:", client);
		};
	}

	get isSingle() {
		return this.#singleMode;
	}

	get client() {
		if (!this.#singleMode) {
			throw new Error("not single mode");
		} else {
			return this.#singleClient;
		}
	}

	onConnect(client, conndata) {
		let obj = CONNS_MAP[this.cmd];
		obj.clients[client.fromid] = client;

		let onConn = this._onConnect || ((client, conndata, callback) => {
			//默认只允许同域
			let mine = location.protocol + "//" + location.host;
			callback(mine == client.origin, null);
		});

		let callback = (isAccept, errOrConndata) => {
			if (isAccept) {
				client.gotConnected();
				doSendMessage(true, client.source, {
					cmd: this.cmd,
					type: "connected",
					mdata: errOrConndata,
					fromid: this.id,
					toid: client.fromid,
				});

				if (this.#singleMode && this.#singleClient) {
					this.#singleClient.close();
					this.#singleClient = null;
				}

				let onConnected = this._onConnected || (() => {
					if (this.#singleMode) {
						this.#singleClient = null;
					}
					client.close(false);
					doSendMessage(true, client.source, {
						cmd: this.cmd,
						type: "close",
						mdata: "not exists connected handle",
						fromid: this.id,
						toid: client.fromid,
					});
				});

				if (this.#singleMode) {
					this.#singleClient = client;
				}

				Callback.call(this, onConnected, client);
				client.checkClientConnected(this);
			} else {
				client.close(false);
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

	close(sendClosed, closeMessage) {
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
						if (client.connected) {
							client.close(sendClosed, closeMessage);
						}
					} catch (e) {
						console.error(e);
					}
				}
				obj.clients = {};
				obj.server = null;
				this.#singleClient = null;
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
	///#server;
	constructor(cmd, option) {
		const gconfig = L.config().plugins.ifmsg;

		if (option === true || option === false) {
			option = {
				singleMode: option
			};
		}

		option = L.extend({
			connTimeout: gconfig.connTimeout,
			sleepTimeout: gconfig.sleepTimeout,
			singleMode: false,
		}, option);

		this.#server = new Server(cmd, option.singleMode);
		this.#server._conntimeout = option.connTimeout;
		this.#server._sleeptimeout = option.sleepTimeout;
	}

	/**
	 *@param {Function} onConnect  function(client,conndata,callback(isAccept,errOrConndata))
	 */
	set onConnect(onConnect) {
		this.#server._onConnect = onConnect ? new Callback(this, onConnect) : null;
	}

	get onConnect() {
		return this.#server._onConnect && this.#server._onConnect.callback;
	}

	/**
	 * @param {Function} onConnectTimeout function(client)
	 */
	set onConnectTimeout(onConnectTimeout) {
		this.#server._onConnectTimeout = onConnectTimeout ? new Callback(this, onConnectTimeout) : null;
	}

	get onConnectTimeout() {
		return this.#server._onConnectTimeout && this.#server._onConnectTimeout.callback;
	}

	/**
	 * @param {Function} onConnected function(client)
	 */
	set onConnected(onConnected) {
		this.#server._onConnected = onConnected ? new Callback(this, onConnected) : null;
	}

	get onConnected() {
		return this.#server._onConnected && this.#server._onConnected.callback;
	}

	get isStart() {
		return this.#server._start;
	}

	get isDestroyed() {
		return this.#server._destroyed;
	}

	get cmd() {
		return this.#server.cmd;
	}

	listen() {
		this.#server.listen();
	}

	close(data) {
		this.#server.close(true, data);
	}

	get isSingle() {
		return this.#server.isSingle;
	}

	get client() {
		return this.#server.client;
	}

}

class IfmsgClient {
	///#client;
	constructor(cmd, option) {
		const gconfig = L.config().plugins.ifmsg;
		option = L.extend({
			connTimeout: gconfig.connTimeout,
			sleepTimeout: gconfig.sleepTimeout,
		}, option);

		this.#client = new Client(cmd, null, null, null, true);
		this.#client._conntimeout = option.connTimeout;
		this.#client._sleeptimeout = option.sleepTimeout;
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
				this.#client.source = source;
				this.#client.connect(conndata);
			};
			iframe.addEventListener("load", fun);
		} else {
			let source = iframe.contentWindow;
			this.#client.source = source;
			this.#client.connect(conndata);
		}
	}

	connParent(conndata) {
		this.#client.source = window.parent;
		this.#client.connect(conndata);
	}

	connTop(conndata) {
		this.#client.source = window.top;
		this.#client.connect(conndata);
	}

	connOpener(conndata) {
		this.#client.source = window.opener;
		this.#client.connect(conndata);
	}

	/**
	 *@param {Function} onConnect  function(source,origin,conndata,callback(isAccept,err))
	 */
	set onConnect(onConnect) {
		this.#client._onConnect = onConnect ? new Callback(this, onConnect) : null;
	}

	get onConnect() {
		return this.#client._onConnect && this.#client._onConnect.callback;
	}

	/**
	 *@param {Function} onConnected
	 */
	set onConnected(onConnected) {
		this.#client._onConnected = onConnected ? new Callback(this, onConnected) : null;
	}

	get onConnected() {
		return this.#client._onConnected && this.#client._onConnected.callback;
	}

	sendMessage(data) {
		this.#client.sendMessage(data);
	}

	/**
	 * @param {Function} onHeartTimeout
	 */
	set onHeartTimeout(onHeartTimeout) {
		this.#client.onHeartTimeout = onHeartTimeout;
	}

	get onHeartTimeout() {
		return this.#client.onHeartTimeout;
	}

	/**
	 * @param {Function} onUnload() 返回的结果用于发送给对方
	 */
	set onUnload(onUnload) {
		this.#client.onUnload = onUnload;
	}

	get onUnload() {
		return this.#client.onUnload;
	}

	/**
	 * @param {Function} onClosed(data)
	 */
	set onClosed(onClosed) {
		this.#client.onClosed = onClosed;
	}

	get onClosed() {
		return this.#client.onClosed;
	}

	/**
	 * @param {Function} onMessage funcation(data)
	 */
	set onMessage(onMessage) {
		this.#client.onMessage = onMessage;
	}

	get onMessage() {
		return this.#client.onMessage;
	}

	/**
	 * @param {Function} callback function(err)
	 */
	set onConnectFail(callback) {
		this.#client._onConnectFail = callback ? new Callback(this, callback) : null;
	}

	get onConnectFail() {
		return this.#client._onConnectFail && this.#client._onConnectFail.callback;
	}

	get connected() {
		return this.#client.connected;
	}

	get destroyed() {
		return this.#client.destroyed;
	}

	close(data) {
		this.#client.close(true, data);
	}

}

L.define("ifmsg", {
	Server: IfmsgServer,
	Client: IfmsgClient,
	debug: new Debug(),
});
