var callback = {};

function act(c) {
	var forEach = c.mock();
	forEach.expect(callback).return();
	c.range1.forEach = forEach;
	c.sut.forEach(callback);
}

act.base = '../addRange';
module.exports = act;