var callback = {};

function act(c) {
	
	c.range1.forEach = c.mock();
	c.range1.forEach.expect(callback).return();

	c.range2.forEach = c.mock();
	c.range2.forEach.expect(callback).return();
	
	c.callback = callback;
	c.sut.forEach(callback);
}

act.base = '../addRange'
module.exports = act;