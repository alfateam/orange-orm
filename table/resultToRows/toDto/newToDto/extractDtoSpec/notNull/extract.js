function act(c){	
	c.dto = {};
	c.returned = c.sut(1,2, c.dto);
}

module.exports = act;