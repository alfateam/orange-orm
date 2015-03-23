function act(c){
	c.filter = {
		and: {}
	};
	
	c.returned = c.sut(c.filter);
	
}

module.exports = act;