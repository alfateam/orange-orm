function act(c){
	c.parent = {};
	c.expected = {};
	c.getRelatives.expect(c.parent, c.sut).return(c.expected);
	c.returned = c.sut.getRelatives(c.parent);
}

module.exports = act;