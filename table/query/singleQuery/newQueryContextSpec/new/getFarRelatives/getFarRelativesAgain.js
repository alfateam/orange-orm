function act(c){
	c.expected = c.returned;
	c.returned = c.sut.getRelatives(c.relationName);

}

module.exports = act;