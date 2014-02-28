function act(c) {	
	c.row1 = {};
	c.row2 = {};
	c.rows = [c.row1,c.row2];
	c.returned = c.resolve(c.rows);
}

module.exports = act;