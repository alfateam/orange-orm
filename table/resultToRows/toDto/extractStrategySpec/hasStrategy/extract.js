function act(c){
	c.strategy = {};	
	c.returned = c.sut(c.strategy, c.table);
}

module.exports = act;