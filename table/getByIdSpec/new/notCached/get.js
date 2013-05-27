var expected = {};
function act(c) {
	c.expected = expected;
	c.tryGetFromCacheById.expect(c.table,c.arg1,c.arg2,c.strategy).return(null);
	c.getFromDbById.expect(c.table,c.arg1,c.arg2,c.strategy).return(expected);
	c.get();
}

act.base = '../../new';
module.exports = act;