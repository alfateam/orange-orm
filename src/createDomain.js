function createDomain() {
	let c = {};
	function run(fn) {
		return fn(c);
	}
	c.run = run;
	return c;
}

module.exports = createDomain;