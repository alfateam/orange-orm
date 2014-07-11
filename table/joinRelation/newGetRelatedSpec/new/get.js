function act(c){
	c.relation.getRows = c.mock();
	c.expected = {};
	c.relation.getRows.expect(c.parent).return(c.expected);
	c.returned = c.sut();
}

module.exports = act;