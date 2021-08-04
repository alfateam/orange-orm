var expected = {};

function act(c) {
	c.row = {};

	c.tryGetFromDbById.exclusive.expect(c.table,c.id,c.strategy).resolve(c.row);

	return c.getExclusive();
}

module.exports = act;