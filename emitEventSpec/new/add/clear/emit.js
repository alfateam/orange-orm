var arg1 = {}, 
	arg2 = {};

function act(c) {
	c.sut(arg1,arg2);
}

act.base = '../clear';
module.exports = act;