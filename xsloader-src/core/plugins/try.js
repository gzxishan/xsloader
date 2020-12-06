import U from "../../util/index.js";
const L = U.global.xsloader;

class TryModule{
	#state="loading";
	#mod=undefined;
	#err=undefined;
	#successArray=[];
	#failedArray=[];
	#finishArray=[];
	
	constructor(promise){
		promise.then((mod)=>{
			this.#state = "defined";
			this.#mod = mod;
			this.#invokeFuns(this.#successArray,[mod]);
			this.#invokeFuns(this.#finishArray,[true,mod]);
		},(err)=>{
			this.#state = "failed";
			this.#mod = err;
			this.#invokeFuns(this.#failedArray,[err]);
			this.#invokeFuns(this.#finishArray,[false,err]);
		});
	}
	
	#invokeFuns(funs,args){
		for(let i=0; i<funs.length; i++){
			try {
				funs[i].apply(this,args);
			} catch (e) {
				console.error(e);
			}
		}
	}
	
	get state(){
		return this.#state;
	}
	
	get module(){
		return this.#mod;
	}
	
	get err(){
		return this.#err;
	}
	
	get isOk(){
		return this.#state == "defined";
	}
	
	set success(callback){
		if(this.#state=="defined"){
			callback(this.#mod);
		}else if(this.#state=="loading"){
			this.#successArray.push(callback);
		}
	}
	
	set failed(callback){
		if(this.#state=="failed"){
			callback(this.#err);
		}else if(this.#state=="loading"){
			this.#failedArray.push(callback);
		}
	}
	
	set finish(callback){
		if(this.#state=="failed" || this.#state=="defined"){
			let isOk = this.#state=="defined";
			let res = isOk ? this.#mod : this.#err;
			callback(isOk, res);
		}else if(this.#state=="loading"){
			this.#finishArray.push(callback);
		}
	}
}

L.TryModule = TryModule;

/**
 * 格式:try!module
 */
L.define("try", {
	isSingle: true,
	pluginMain(arg, onload, onerror, config) {
		let dep = arg;

		let tryModule = new TryModule(new Promise((resolve, reject) => {
			this.invoker().withAbsUrl().require([dep], function(mod, depModuleArgs) {
				resolve(mod);
			}).error(function(err, invoker) {
				console.warn(`try!:require '${dep}' failed`);
				reject(err);

				// return {
				// 	ignoreErrState: true,
				// 	onGetModule: () => {
				// 		return null;
				// 	},
				// 	onFinish: () => {
				// 		tryModule.state = "failed";
				// 		tryModule.failed(err, invoker);
				// 		reject(err);
				// 	}
				// }
			}).setTag(`try!${arg}`);

		}));

		onload(tryModule);
	}
});
