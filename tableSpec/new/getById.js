var id = {};
var strategy = {};

function act(c) {
	c.expected = {};
	c.getById.expect(c.sut,id,strategy).return(c.expected);
	c.returned = c.sut.getById(id,strategy);

	c.expectedExclusive = {};
	c.getById.exclusive.expect(c.sut,id,strategy).return(c.expectedExclusive);
	c.returnedExclusive = c.sut.getById.exclusive(id,strategy);
}

module.exports = act;