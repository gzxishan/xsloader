let g;
if(typeof window !== undefined) {
	g = window;
} else if(typeof self !== undefined) {
	g = self;
} else if(typeof global !== undefined) {
	g = global;
} else {
	throw new Error("not found global var!");
}

export default {
	global:g
};
