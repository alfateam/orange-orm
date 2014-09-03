function act(c){
	c.expected = {};
	c.sut.expanded = true;
	c.relation.getFromCache = c.mock();
	c.relation.getFromCache.expect(c.parent).return(c.expected);

	c.returned = c.sut();

}

module.exports = act;