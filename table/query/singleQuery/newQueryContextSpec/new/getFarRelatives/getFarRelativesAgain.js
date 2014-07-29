function act(c){
	c.expected = c.returned;
	c.returned = c.sut.getFarRelatives(c.relationName);

}

module.exports = act;