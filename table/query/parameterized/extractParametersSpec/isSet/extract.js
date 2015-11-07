function act(c){	
	c.param1 = {};
	c.param2 = {};
	c.parameters = [c.param1, c.param2];
	c.returned = c.sut(c.parameters);
}

module.exports = act;