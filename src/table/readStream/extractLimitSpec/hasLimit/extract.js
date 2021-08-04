function act(c){	
	c.span.limit = 5;
	c.expected = ' limit 5';
	c.returned = c.sut(c.span);
}

module.exports = act;