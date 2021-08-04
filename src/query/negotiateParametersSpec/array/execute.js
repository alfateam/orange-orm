function act(c){
	c.parameters = [1,2,3];
	c.returned = c.sut(c.parameters);
}

module.exports = act;