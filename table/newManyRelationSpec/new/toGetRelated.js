function act(c) {
	c.parentRow = {};
	c.expected = {};
	c.newGetRelated.expect(c.parentRow, c.sut).return(c.expected);

	c.returned = c.sut.toGetRelated(c.parentRow);
} 

module.exports = act;