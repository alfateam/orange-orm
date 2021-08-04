function act(c){		
	c.rows = {};
	c.returned = c.sut({}, c.rows);
}

module.exports = act;