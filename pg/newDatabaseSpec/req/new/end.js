function act(c){
	c.pool.end = c.mock();
	c.expected = {};
	c.pool.end.expect().return(c.expected);

	c.returned = c.sut.end();
}

module.exports = act;