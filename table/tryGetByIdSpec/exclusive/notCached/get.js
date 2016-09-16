var expected = {};
function act(c) {
	c.expected = expected;
	c.tryGetFromCacheById.expect(c.table,c.arg1,c.arg2,c.strategy).return(null);
	c.tryGetFromDbById.exclusive = c.mock();
	c.tryGetFromDbById.exclusive.expect(c.table,c.arg1,c.arg2,c.strategy).return(expected);
	c.getExclusive();
}

module.exports = act;