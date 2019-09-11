/* 
 ** ToProgress v0.1.1
 ** http://github.com/djyde/ToProgress
 */

// Animation Detection
function whichTransitionEvent() {
	let t,
		el = document.createElement("fakeelement");

	let transitions = {
		"transition": "transitionend",
		"OTransition": "oTransitionEnd",
		"MozTransition": "transitionend",
		"WebkitTransition": "webkitTransitionEnd"
	}

	for(t in transitions) {
		if(el.style[t] !== undefined) {
			return transitions[t];
		}
	}
}

let transitionEvent = whichTransitionEvent();

const ToProgress = function(opt, selector) {
	// Attributes
	let that = this;
	this.progress = 0;
	this.options = {
		id: 'xsloader-top-progress-bar',
		color: '#F44336',
		height: '2px',
		duration: 0.2
	};
	if(opt && typeof opt === 'object') {
		for(let key in opt) {
			this.options[key] = opt[key];
		}
	}
	this.options.opacityDuration = this.options.duration * 3;
	this.progressBar = document.createElement('div');

	// Initialization
	this.progressBar.id = this.options.id;
	this.progressBar.setCSS = function(style) {
		for(let property in style) {
			this.style[property] = style[property];
		}
	}
	this.progressBar.setCSS({
		"position": selector ? "relative" : "fixed",
		"padding": "0",
		"margin": "0",
		"top": "0",
		"left": "0",
		"right": "0",
		"background-color": this.options.color,
		"height": this.options.height,
		"width": "0%",
		"transition": "width " + this.options.duration + "s" + ", opacity " + this.options.opacityDuration + "s",
		"-moz-transition": "width " + this.options.duration + "s" + ", opacity " + this.options.opacityDuration + "s",
		"-webkit-transition": "width " + this.options.duration + "s" + ", opacity " + this.options.opacityDuration + "s"
	});

	// Create the Progress Bar
	if(selector) {
		let el = document.querySelector(selector);
		if(el) {
			if(el.hasChildNodes()) {
				el.insertBefore(this.progressBar, el.firstChild);
			} else {
				el.appendChild(this.progressBar);
			}
		}
	} else {
		document.body.appendChild(this.progressBar);
	}
};

////////////////////////////////////
ToProgress.prototype.setColor = function(color) {
	this.progressBar.setCss({
		"background-color": color
	});
};

ToProgress.prototype._isAuto = false;
ToProgress.prototype._timer = null;

ToProgress.prototype.stopAuto = function() {
	this._isAuto = false;
	if(this._timer) {
		clearInterval(this._timer);
		this._timer = null;
	}
};

ToProgress.prototype.autoIncrement = function(time = 100) {
	this.stopAuto();
	this._isAuto = true;
	let dt = time < 100 ? 100 : time;

	let k = 100; //
	let step = 0.1;
	let x = 1 - step;
	this._timer = setInterval(() => {
		x += step;
		this.setProgress(100 - k / x);
	}, dt);
};
///////////////////////////////////

ToProgress.prototype.transit = function() {
	this.progressBar.style.width = this.progress + '%';
};

ToProgress.prototype.getProgress = function() {
	return this.progress;
};

ToProgress.prototype.setProgress = function(progress, callback) {
	this.show();
	if(progress > 100) {
		this.progress = 100;
	} else if(progress < 0) {
		this.progress = 0;
	} else {
		this.progress = progress;
	}
	this.transit();
	callback && callback();
};

ToProgress.prototype.increase = function(toBeIncreasedProgress, callback) {
	this.show();
	this.setProgress(this.progress + toBeIncreasedProgress, callback);
};

ToProgress.prototype.decrease = function(toBeDecreasedProgress, callback) {
	this.show();
	this.setProgress(this.progress - toBeDecreasedProgress, callback);
};

ToProgress.prototype.finish = function(callback) {
	let that = this;
	this.setProgress(100, callback);
	setTimeout(() => {
		this.hide();
		let fun;
		fun = function(e) {
			that.reset();
			that.progressBar.removeEventListener(e.type, fun);
			this.progressBar.parentNode.removeChild(this.progressBar);
		};
		transitionEvent && this.progressBar.addEventListener(transitionEvent, fun);
		if(!transitionEvent) {
			this.progressBar.parentNode.removeChild(this.progressBar);
		}
	}, 150);
};

ToProgress.prototype.reset = function(callback) {
	this.progress = 0;
	this.transit();
	callback && callback();
};

ToProgress.prototype.hide = function() {
	this.progressBar.style.opacity = '0';
};

ToProgress.prototype.show = function() {
	this.progressBar.style.opacity = '1';
};

export default {
	ToProgress
};