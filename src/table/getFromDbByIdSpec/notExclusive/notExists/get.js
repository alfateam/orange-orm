var expected = {};

function act(c) {
	c.tryGetFromDbById.expect(c.table,c.id,c.strategy).resolve(null);

	return c.get();
}

module.exports = act;