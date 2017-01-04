var expected = {};
var cached = {};

function act(c) {
	c.expected = expected;
	c.tryGetFromCacheById.expect(c.table,c.arg1,c.arg2,c.strategy).return(cached);
	c.resultToPromise.expect(cached).return(expected);
	c.get();
}

module.exports = act;