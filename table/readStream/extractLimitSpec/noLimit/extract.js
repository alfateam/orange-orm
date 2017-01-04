function act(c){	
	c.expected = '';
	c.returned = c.sut(c.span);
}

module.exports = act;