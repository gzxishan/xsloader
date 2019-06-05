import B from "./b.js";
let a = {
	b: "c",
	c: "d",
	B
};
let b = { ...a
}; // code2
let set = new Set().add('a').add('b').add('c');
let [x, y] = set;
let [first, ...rest] = set;
export {
	b,
	first,
	rest
};