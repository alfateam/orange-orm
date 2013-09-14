var mock = require('a').mock;

function act(c) {
	c.element3 = {};
	c.element4 = {};
	var forEach = c.mock();
	forEach.expectAnything().whenCalled(onForEach);
	c.range1.forEach = forEach;
	c.returned = c.sut.toArray();

	function onForEach(range1Callback) {
		range1Callback(c.element3,0);
		range1Callback(c.element4,0);
	}
}


act.base = '../add';
module.exports = act;