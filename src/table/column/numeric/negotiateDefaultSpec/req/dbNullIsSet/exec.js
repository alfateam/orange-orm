function act(c) {	
	c.column = {};
	c.expectedDefault = 1;
	c.column.default = c.expectedDefault;
	c.sut(c.column);
}

act.base = '../../req';
module.exports = act;