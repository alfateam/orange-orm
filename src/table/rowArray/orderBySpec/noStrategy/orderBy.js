function act(c){		
	c.rows = {};
	c.returned = c.sut(undefined, c.rows);
}

module.exports = act;