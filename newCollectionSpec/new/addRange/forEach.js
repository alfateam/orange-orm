var mock = require('a').mock,
	callback,
	element3 = {},
	element4 = {};

function act(c) {
	stubCallback();
	var forEach = c.mock();
	forEach.expectAnything().whenCalled(onForEach);
	c.range1.forEach = forEach;
	c.sut.forEach(callback);

	function stubCallback() {
		callback = mock();
		callback.expect(c.element,0);
		callback.expect(c.element2,1);
		callback.expect(element3,2);
		callback.expect(element4,3);
		c.callback = callback;
	}	

	function onForEach(range1Callback) {
		range1Callback(element3,0);
		range1Callback(element4,0);
	}

}


act.base = '../addRange';
module.exports = act;