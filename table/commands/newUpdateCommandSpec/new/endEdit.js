function act(c) {
	c.row.unsubscribeChanged = c.mock();
	c.row.unsubscribeChanged.expect(c.raiseFieldChanged);
	c.sut.endEdit();
}

module.exports = act;