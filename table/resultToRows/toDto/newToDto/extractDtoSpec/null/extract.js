function act(c){	
	c.dto = {};
	c.newObject.expect().return(c.dto);
	c.returned = c.sut(1,2);
}

module.exports = act;