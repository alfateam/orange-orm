function act(c) {	
	c.column = {};
	c.sut(c.column);
}

act.base = '../req';
module.exports = act;