var expected = {};

function act(c) {
	c.row = {};

	c.tryGetFromDbById.expect(c.table,c.id,c.strategy).resolve(c.row);

	return c.get();
}

module.exports = act;