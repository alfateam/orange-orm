function act(c) {
	c.rows.remove = c.mock();
	c.rows.remove.expect(c.row);
	c.sut.dirty(c.row);
}

module.exports = act;