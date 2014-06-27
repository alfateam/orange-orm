function act(c) {
	c.returned = c.sut(c.parentRow, c.relation);
}

module.exports = act;