function act(c) {
	c.parentRow = {};
	c.expected = {};
	c.getRelatives.expect(c.parentRow, c.sut).return(c.expected);
	c.returned = c.sut.getRelatives(c.parentRow);
}

module.exports = act;