import {
	setTimeout,
	scripts,
	IE_VERSION,
	global,
	tglobal,
	xsJSON,
	getNodeAbsolutePath,
	getPathWithRelative,
	dealPathMayAbsolute,
	appendArgs2Url,
} from './utils.js';

import './core/global-xsloader-vars.js';
import { xsloader } from './core/xsloader.js';

global.xsloader = xsloader;