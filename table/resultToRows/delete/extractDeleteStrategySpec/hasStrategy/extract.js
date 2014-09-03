function act(c){
	
	c.strategy = {};
	c.returned = c.sut(c.strategy);
}

module.exports = act;