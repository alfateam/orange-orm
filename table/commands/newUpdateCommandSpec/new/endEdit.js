function act(c) {
	c.row.unsubscribeChanged = c.mock();
	c.row.unsubscribeChanged.expect(c.raiseFieldChanged);
	c.stubCommand();
	c.sut.endEdit();
}

module.exports = act;