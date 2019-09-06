if(!Object.keys) {
	Object.keys = (function() {
		let hasOwnProperty = Object.prototype.hasOwnProperty,
			hasDontEnumBug = !({
				toString: null
			}).propertyIsEnumerable('toString'),
			dontEnums = [
				'toString',
				'toLocaleString',
				'valueOf',
				'hasOwnProperty',
				'isPrototypeOf',
				'propertyIsEnumerable',
				'constructor'
			],
			dontEnumsLength = dontEnums.length;

		return function(obj) {
			if(typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');

			let result = [];

			for(let prop in obj) {
				if(hasOwnProperty.call(obj, prop)) result.push(prop);
			}

			if(hasDontEnumBug) {
				for(let i = 0; i < dontEnumsLength; i++) {
					if(hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
				}
			}
			return result;
		};
	})();
}

if(!Array.prototype.forEach) {
	Array.prototype.forEach = function forEach(callback, thisArg) {
		let T, k;
		if(this == null) {
			throw new TypeError("this is null or not defined");
		}
		let O = Object(this);
		let len = O.length >>> 0;
		if(typeof callback !== "function") {
			throw new TypeError(callback + " is not a function");
		}
		if(arguments.length > 1) {
			T = thisArg;
		}
		k = 0;
		while(k < len) {
			let kValue;
			if(k in O) {
				kValue = O[k];
				callback.call(T, kValue, k, O);
			}
			k++;
		}
	};
}
