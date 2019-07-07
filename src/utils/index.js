import * as browser from './browser.js';
import * as funs from './funs.js';
import * as other from './other.js';
import * as urls from './urls.js';

import * as polyfill from '../polyfill/index.js';

export {
	...browser,
	...funs,
	...other,
	...urls,
	...polyfill
}