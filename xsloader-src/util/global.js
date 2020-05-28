let G;
if(typeof window !== undefined) {
	G = window;
} else if(typeof self !== undefined) {
	G = self;
} else if(typeof global !== undefined) {
	G = global;
} else {
	throw new Error("not found global var!");
}

export default G;