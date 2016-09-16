var expected = {};

function act(c) {
	c.tryGetFromDbById.exclusive.expect(c.table,c.id,c.strategy).resolve(null);

	return c.getExclusive();
}

module.exports = act;