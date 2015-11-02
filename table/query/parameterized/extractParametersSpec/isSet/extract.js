function act(c){	
	c.parameters = {};
	c.returned = c.sut(c.parameters);
}

module.exports = act;