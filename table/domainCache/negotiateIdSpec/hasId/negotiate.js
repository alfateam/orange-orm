function act(c){
	
	c.id = {};
	c.returned = c.sut(c.id);
}

module.exports = act;