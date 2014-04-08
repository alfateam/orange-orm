function act(c){
	c.mockTable();
	c.row = {};
	c.pkValue = {};
	c.pk2Value = {};
	c.key = [c.pkValue, c.pk2Value];
	c.row[c.pkAlias] = c.pkValue;
	c.row[c.pk2Alias] = c.pk2Value;
	
	c.domainCache.tryRemove = c.mock();
	c.expected = {};
	c.domainCache.tryRemove.expect(c.key).return(c.expected);

	c.sut.tryRemove(c.row);
}

module.exports = act;