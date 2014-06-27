function act(c) {
	c.parentRow = {};
	c.expected = {};
	c.tryGetByHeuristic.expect(c.parentRow, c.sut).return(c.expected);
	c.returned = c.sut.tryGetByHeuristic(c.parentRow);
}

module.exports = act;