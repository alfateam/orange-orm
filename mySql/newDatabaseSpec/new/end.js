function act(c){
	c.expected = {};
	c.pool.end = c.mock();
	c.pool.end.expect().return(c.expected);
	
	c.returned = c.sut.end();
}

module.exports = act;