function act(c){
	c.parent = {};
	c.other = {};
	c.expected = {};
	c.manyCache.tryGet = c.mock();

	c.manyCache.tryGet.expect(c.parent).return([c.expected, c.other]);
	
	c.returned = c.sut.tryGet(c.parent);
}

module.exports = act;