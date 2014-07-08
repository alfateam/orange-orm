function act(c){
	c.parent = {};
	c.expected = {};
	c.newGetRelated.expect(c.parent, c.sut).return(c.expected);
	c.returned = c.sut.toGetRelated(c.parent);
}

module.exports = act;