var arg1 = {};
var arg2 = {};

function act(c) {
	c.callback2.expect(arg1,arg2);
	c.sut(arg1,arg2);
}

act.base = '../remove';
module.exports = act;