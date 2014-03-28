function act(c){
	c.row = {};
	c.pkValue = {};
	c.pk2Value = {};
	c.key = [c.pkValue, c.pk2Value];
	c.row[c.pkAlias] = c.pkValue;
	c.row[c.pk2Alias] = c.pk2Value;
	
	c.domainCache.add = c.mock();
	c.expected = {};
	c.domainCache.add.expect(c.key, c.row).return(c.expected);

	c.returned = c.sut.add(c.row);
}

module.exports = act;