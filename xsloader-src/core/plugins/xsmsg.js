import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

try {
	let isXsMsgDebug = false;
	let api = {};

	function isDebug(type) {
		return isXsMsgDebug;
	}

	api.linkedList = function() {
		return new LinkedList();
	};

	function LinkedList() {
		function newNode(element) {
			let node = {
				element: element,
				next: null,
				pre: null
			};
			return node;
		}
		let length = 0;
		let headNode = newNode(),
			lastNode = headNode;

		/**
		 * 在链表末尾添加元素
		 */
		this.append = function(element) {
			let current = newNode(element);

			lastNode.next = current;
			current.pre = lastNode;
			lastNode = current;
			length++;
		};

		//在链表的任意位置插入元素
		this.insert = function(position, element) {
			if(position >= 0 && position <= length) {

				let node = newNode(element);
				let pNode = headNode;
				while(position--) {
					pNode = pNode.next;
				}

				if(pNode.next) {
					pNode.next.pre = node;
					node.next = pNode.next;
				}
				pNode.next = node;
				node.pre = pNode;
				length++;
				return true;
			} else {
				return false;
			}
		};

		this.elementAt = function(position) {
			return getElement(position);
		};

		function getElement(position, willRemove) {
			if(position >= 0 && position < length) {

				let pNode = headNode;
				while(position--) {
					pNode = pNode.next;
				}

				if(pNode.next) {
					let currentNode = pNode.next;
					if(willRemove) {
						let nextCurrentNode = currentNode.next;
						if(nextCurrentNode) {
							nextCurrentNode.pre = pNode;
							pNode.next = nextCurrentNode;
						} else {
							pNode.next = null;
							lastNode = pNode;
						}
						length--;
					}
					return currentNode.element;
				} else {
					return undefined;
				}
			} else {
				return undefined;
			}
		}

		/**
		 * @param callback function 返回true表示移除
		 */
		this.eachForRemove = function(callback) {
			let pNode = headNode.next;
			while(pNode) {
				let currentNode = pNode;
				if(callback(currentNode)) {
					let nextCurrentNode = currentNode.next;
					if(nextCurrentNode) {
						nextCurrentNode.pre = pNode;
						pNode.next = nextCurrentNode;
					} else {
						pNode.next = null;
						lastNode = pNode;
					}
					length--;
					pNode = nextCurrentNode;
				} else {
					pNode = pNode.next;
				}
			}
		};

		//从链表中移除元素
		this.removeAt = function(position) {
			return getElement(position, true);
		};

		/**
		 * 移除并获取第一个元素
		 * @param callback function(elem,index)
		 */
		this.pop = function(callback) {
			return this.removeAt(0);
		};

		/**
		 * 返回元素在链表中的位置
		 * @param element object|function(elem)
		 */
		this.indexOf = function(element) {
			let pNode = headNode.next;
			let index = 0;
			while(pNode) {
				if(typeof element == "function") {
					if(element(pNode.element)) {
						return index;
					}
				} else if(pNode.element === element) {
					return index;
				}
				index++;
				pNode = pNode.next;
			}
			return -1;
		};

		this.find = function(element) {
			let index = this.indexOf(element);
			return index >= 0 ? this.elementAt(index) : undefined;
		};

		//移除某个元素
		this.remove = function(element) {
			let index = this.indexOf(element);
			return this.removeAt(index);
		};

		//判断链表是否为空

		this.isEmpty = function() {
			return length === 0;
		};

		//返回链表的长度
		this.size = function() {
			return length;
		};

	}

	if(window.addEventListener) {
		let postMessageBridge = (function() {
			let handle = {};

			let instanceMap = {}; //id:listener
			let cmd2ListenerMap = {}; //cmd:[]
			let instanceBindMap = {}; //instanceid:true
			let oinstanceidMap = {}; //已经被绑定的oinstanceid:instanceid

			//isActive为false表示监听者
			handle.listen = function(cmd, conndata, connectingSource, source, isActive, _onConned, _onMsg, _onResponse, _onElse) {

				let listener = {
					cmd: cmd,
					_onConned: _onConned,
					_onMsg: _onMsg,
					_onResponse: _onResponse,
					_onElse: _onElse,
					conndata: conndata,
					osource: source,
					active: isActive,
					connectingSource: connectingSource,
					id: xsloader.randId(),
					refused: {}
				};

				if(!cmd2ListenerMap[cmd]) {
					cmd2ListenerMap[cmd] = [];
				}
				cmd2ListenerMap[cmd].push(listener);

				let instanceid = listener.id;
				instanceMap[instanceid] = listener;
				return instanceid;
			};

			handle.remove = function(instanceid) {
				//TODO !!!!!!!
				/*let listener = listeners[id];
				delete listeners[id];
				if(listener.active) {
					for(let x in activeListenerMyIds) {
						let as = activeListenerMyIds[x];
						let found = false;
						for(let k = 0; k < as.length; k++) {
							if(as[k] == id) {
								as.splice(k, 1);
								found = true;
								break;
							}
						}
						if(found) {
							break;
						}
					}
				}*/
			};

			handle.send = function(data, instanceid, msgid) {
				let listener = instanceMap[instanceid];
				_sendData("msg", listener.cmd, listener.osource, data, instanceid, msgid);
			};

			handle.sendConn = function(instanceid) {
				let listener = instanceMap[instanceid];
				_sendData("conn", listener.cmd, listener.osource, listener.conndata, instanceid);
			};

			handle.sendResponse = function(data, instanceid) {
				let listener = instanceMap[instanceid];
				_sendData("response", listener.cmd, listener.osource, data, instanceid);
			};

			function handleConn(cmd, fromSource, originStr, data, oinstanceid) {
				if(oinstanceidMap[oinstanceid]) {
					//console.warn("already bind:" + cmd);
					return;
				}
				let listeners = cmd2ListenerMap[cmd];
				if(!listeners) {
					return;
				}

				function Callback(instanceid) {

					return function(isAccept, msg) {
						if(!isAccept) {
							let listener = instanceMap[instanceid];
							listener.refused[oinstanceid] = true;
							return;
						}
						if(oinstanceidMap[oinstanceid]) {
							console.warn("already bind other:" + cmd + ",my page:" + location.href);
						} else if(instanceBindMap[instanceid]) {
							console.warn("already self bind:" + cmd + ",my page:" + location.href);
							_sendData("binded", cmd, fromSource, oinstanceid);
						} else {
							oinstanceidMap[oinstanceid] = instanceid;
							instanceBindMap[instanceid] = true;
							let listener = instanceMap[instanceid];
							listener.osource = fromSource;
							listener.origin = originStr;
							_sendData("accept", cmd, fromSource, listener.conndata, instanceid, oinstanceid);
						}
					};

				}

				for(let i = 0; i < listeners.length; i++) {
					let listener = listeners[i];
					if(!listener.refused[oinstanceid]) {
						listener.connectingSource(fromSource, originStr, data, Callback(listener.id));
					}
				}
			}

			function handleAccept(cmd, fromSource, originStr, data, oinstanceid, minstanceid) {
				let listeners = cmd2ListenerMap[cmd];
				if(!listeners) {
					return;
				}

				function Callback(instanceid) {

					return function(isAccept, msg) {
						if(!isAccept) {
							let listener = instanceMap[instanceid];
							listener.refused[oinstanceid] = true;
							return;
						}
						if(oinstanceidMap[oinstanceid]) {
							console.warn("already bind:" + cmd + ",my page:" + location.href);
						} else if(instanceBindMap[instanceid]) {
							console.warn("already self bind:" + cmd + ",my page:" + location.href);
							_sendData("binded", cmd, fromSource, oinstanceid);
						} else {
							oinstanceidMap[oinstanceid] = instanceid;
							instanceBindMap[instanceid] = true;

							let listener = instanceMap[instanceid];
							listener.osource = fromSource;
							listener.origin = originStr;
							_sendData("conned", cmd, fromSource, listener.conndata, instanceid);
							listener._onConned(fromSource, data);
						}
					};

				}

				for(let i = 0; i < listeners.length; i++) {
					let listener = listeners[i];
					if(listener.id == minstanceid && !listener.refused[oinstanceid]) { //当前为主动发起连接的页面
						listener.connectingSource(fromSource, originStr, data, Callback(listener.id));
					}
				}
			}

			function handleBinded(cmd, fromSource, originStr, minstanceid) {
				let listener = instanceMap[minstanceid];
				listener._onElse("binded");
			}

			function checkSource(listener, fromSource, originStr) {
				if(listener.osource != fromSource && listener.origin != originStr) {
					console.warn("expected:" + listener.origin + ",but:" + originStr);
					throw new Error("source changed!");
				}
			}

			function handleConned(cmd, fromSource, originStr, data, oinstanceid) {
				let instanceid = oinstanceidMap[oinstanceid];
				let listener = instanceMap[instanceid];
				checkSource(listener, fromSource, originStr);

				listener._onConned(listener.osource, data);
			}

			function handleMsg(cmd, fromSource, originStr, data, oinstanceid, msgid) {
				let instanceid = oinstanceidMap[oinstanceid];
				let listener = instanceMap[instanceid];
				checkSource(listener, fromSource, originStr);

				listener._onMsg(data, msgid);
			}

			function handleResponse(cmd, fromSource, originStr, data, oinstanceid) {
				let instanceid = oinstanceidMap[oinstanceid];
				let listener = instanceMap[instanceid];
				checkSource(listener, fromSource, originStr);

				listener._onResponse(data);
			}

			function _sendData(type, cmd, source, data, instanceid, msgid) {
				let msg = {
					type: type,
					data: data,
					cmd: cmd,
					id: instanceid,
					msgid: msgid
				};

				if(isDebug("postMessageBridge")) {
					console.log("send from:" + location.href);
					console.log(msg);
				}
				source.postMessage(xsloader.xsJson2String(msg), "*");
			}

			window.addEventListener('message', function(event) {
				if(event.data && (typeof event.data == "string") && event.data.substring(0, 1) == "{") {
					if(isDebug("postMessageBridge")) {
						console.log("receive from:" + event.origin + ",my page:" + location.href);
						console.log(event.data);
					}

					let data;
					try {
						data = xsloader.xsParseJson(event.data);
					} catch(e) {
						console.warn("error data:", event.data);
						console.warn(e);
					}
					if(!data || !(data.cmd && data.type)) {
						return;
					}

					try {
						let cmd = data.cmd;
						let oinstanceid = data.id;
						let rdata = data.data;
						let type = data.type;
						let msgid = data.msgid;

						if(type == "conn") {
							handleConn(cmd, event.source, event.origin, rdata, oinstanceid);
						} else if(type == "accept") {
							handleAccept(cmd, event.source, event.origin, rdata, oinstanceid, msgid);
						} else if(type == "conned") {
							handleConned(cmd, event.source, event.origin, rdata, oinstanceid);
						} else if(type == "msg") {
							handleMsg(cmd, event.source, event.origin, rdata, oinstanceid, msgid);
						} else if(type == "response") {
							handleResponse(cmd, event.source, event.origin, rdata, oinstanceid);
						} else if(type == "binded") {
							handleBinded(cmd, event.source, event.origin, rdata);
						}
					} catch(e) {
						console.error(e);
					}

				}

			});

			handle.runAfter = function(time, callback) {
				setTimeout(callback, time);
			};

			return handle;
		})();

		/**
		 * 
		 * @param {Object} cmd
		 * @param {Object} source
		 * @param {Object} connectingSource
		 * @param {Object} onfailed
		 * @param {Object} isActive
		 * @param {Object} conndata 连接传送的数据
		 * @param {Object} timeout 连接超时时间，毫秒
		 * @param {Object} sleep 连接检测的休眠时间，毫秒
		 */
		function CommunicationUnit(cmd, source, connectingSource, onfailed, isActive, conndata, timeout, sleep) {
			let msgQueue = new LinkedList();

			let SLEEP = sleep;
			let starttime;
			let isFailed = false;
			let isConnected = false;
			let isCanceled = false;

			let thiz = this;
			let handleId;

			this.onConnectedListener = null;
			this.onReceiveListener = null;
			this.send = function(data) {
				let msg = {
					id: xsloader.randId(),
					data: data
				};
				msgQueue.append(msg);
				sendTop();
			};

			this.send.release = function() {
				postMessageBridge.remove(handleId);
			};

			function couldChat() {
				return !isFailed && !isCanceled;
			}

			function _onConned(_source, data) {
				if(couldChat()) {
					thiz.onConnectedListener.call(thiz, data);
					isConnected = true;
					sendTop();
				}
			}

			function _onMsg(data, msgid) {
				if(couldChat()) {
					try {
						thiz.onReceiveListener.call(thiz, data);
					} catch(e) {
						console.warn(e);
					}
					postMessageBridge.sendResponse({ //回应已经收到
						id: msgid
					}, handleId);
				}
			}

			function _onResponse(data) {
				msgQueue.remove(function(elem) {
					return elem.id = data.id;
				});
				couldChat() && sendTop();
			}

			function _onElse(type) {
				if(type == "binded") {
					isCanceled = true;
					console.error("connect failed,that page already binded:" + cmd + ",my page:" + location.href);
					onfailed("canceled");
				}
			}

			function initListen() {
				handleId = postMessageBridge.listen(cmd, conndata, connectingSource, source, isActive, _onConned, _onMsg, _onResponse, _onElse);
			}

			function sendTop() {
				if(isConnected) {
					let msg;
					while((msg = msgQueue.pop())) {
						postMessageBridge.send(msg.data, handleId, msg.id);
					}
				}
			}

			function isTimeout() {
				let dt = new Date().getTime() - starttime;
				return dt > timeout;
			}

			/**
			 * 主动方初始化
			 */
			function initActively() {
				if(isConnected || isTimeout() || isCanceled) {
					if(!isConnected && !isCanceled) {
						isFailed = true;
						onfailed("timeout:connect");
					}
					return;
				}
				postMessageBridge.sendConn(handleId);
				postMessageBridge.runAfter(SLEEP, initActively);
			}

			/**
			 * 被动方检查
			 */
			function checkPassively() {
				if(isConnected || isTimeout() || isCanceled) {
					if(!isConnected && !isCanceled) {
						isFailed = true;
						onfailed("timeout:wait connect");
					}
					return;
				}
				postMessageBridge.runAfter(SLEEP, checkPassively);
			}

			{
				starttime = new Date().getTime();
				if(source) {
					initListen();
					initActively();
				} else if(!isActive) {
					initListen();
					checkPassively();
				}
			}

			this.setSource = function(_source) {
				source = _source;
				if(source) {
					initListen();
					initActively();
				}
			};
		}

		let handleApi = api;

		/**
		 * 
		 * @param {Object} winObjOrCallback
		 * @param {Object} option
		 * @param {Object} notActive
		 */
		function _connectWindow(winObjOrCallback, option, notActive) {
			const gconfig = xsloader.config().plugins.xsmsg;
			option = xsloader.extendDeep({
				cmd: "default-cmd",
				listener: null,
				connected: null,
				conndata: null,
				timeout: gconfig.timeout,
				sleep: gconfig.sleep,
				connectingSource: function(source, origin, conndata, callback) {
					let mine = location.protocol + "//" + location.host;
					callback(mine == origin, "default");
				},
				onfailed: function(errtype) {
					if(errtype.indexOf("timeout:") == 0) {
						console.warn("connect may timeout:cmd=" + option.cmd + " ,err='" + errtype + "' ,my page=" + location.href);
					}
				}
			}, option);

			let cmd = option.cmd;
			let connectedCallback = option.connected;
			let receiveCallback = option.listener;
			let conndata = option.conndata;
			let onfailed = option.onfailed;
			let timeout = option.timeout;
			let sleep = option.sleep;

			let isActive = !notActive;
			let connectingSource = option.connectingSource;

			let unit;
			if(typeof winObjOrCallback == "function") {
				unit = new CommunicationUnit(cmd, null, connectingSource, onfailed, isActive, conndata, timeout, sleep);
			} else {
				unit = new CommunicationUnit(cmd, winObjOrCallback, connectingSource, onfailed, isActive, conndata, timeout, sleep);
			}

			connectedCallback = connectedCallback || function(sender, conndata) {
				console.log((isActive ? "active" : "") + " connected:" + cmd);
			};
			if(connectedCallback) {
				unit.onConnectedListener = function(conndata) {
					try {
						connectedCallback(this.send, conndata);
					} catch(e) {
						console.error(e);
					}
				};
			}
			if(receiveCallback) {
				unit.onReceiveListener = function(data) {
					try {
						receiveCallback(data, this.send);
					} catch(e) {
						console.error(e);
					}
				};
			}
			if(typeof winObjOrCallback == "function") {
				winObjOrCallback(function(winObj) {
					unit.setSource(winObj);
				});
			}

			return unit.send;
		}

		function _connectIFrame(iframe, option) {
			let winObj;
			if(typeof iframe == "string") {
				//iframe = ddocument.querySelector(iframe);
				winObj = function(callback) {
					iframe.onload = function() {
						callback(this.contentWindow);
					};
				};
			} else {
				winObj = iframe.contentWindow;
			}
			return _connectWindow(winObj, option);

		}

		/**
		 * 用于连接iframe.
		 * @param {Object} iframe iframe或selector
		 * @param {Object} option
		 * @return 返回sender
		 */
		handleApi.connectIFrame = function(iframe, option) {
			return _connectIFrame(iframe, option);
		};

		/**
		 * 用于连接父页面.
		 * @param {Object} option
		 * @return 返回sender
		 */
		handleApi.connectParent = function(option) {
			return _connectWindow(window.parent, option);
		};

		/**
		 * 用于连接顶层页面.
		 * @param {Object} option
		 * @return 返回sender
		 */
		handleApi.connectTop = function(option) {
			return _connectWindow(window.top, option);
		};

		/**
		 * 用于连接打开者.
		 * @param {Object} option
		 * @return 返回sender
		 */
		handleApi.connectOpener = function(option) {
			return _connectWindow(window.opener, option);
		};

		/**
		 * 用于监听其他页面发送消息.
		 * @param {Object} option
		 * @return 返回一个sender
		 */
		handleApi.listenMessage = function(option) {
			return _connectWindow(null, option, true);
		};

		handleApi.debug = function(isDebug) {
			isXsMsgDebug = isDebug;
		};

		/**
		 * *******************
		 * option参数
		 *********************
		 * option.cmd:
		 * option.connectingSource:function(source,origin,conndata,callback(isAccept,msg))默认只选择同源
		 * option.listener: function(data,sender)
		 * option.connected:function(sender,conndata)
		 * option.onfailed:function(errtype):errtype,timeout,canceled
		 * option.conndata:
		 * option.timeout:连接超时时间
		 * option.sleep:连接检测休眠时间
		 **************
		 * 回调的extra参数
		 **************
		 * originStr:对方页面的地址
		 */
		xsloader.define("xsmsg", handleApi); //TODO STRONG xsmsg
	}

	xsloader.define("XsLinkedList", function() {
		return LinkedList;
	});
} catch(e) {
	console.error(e);
}