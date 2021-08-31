var arg1 = {}, 
	arg2 = {};

function act(c) {
	c.callback.expect(arg1,arg2);
	c.callback2.expect(arg1,arg2);
	c.sut(arg1,arg2);
}

act.base = '../add';
module.exports = act;