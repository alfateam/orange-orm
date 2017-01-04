var id = {};
var strategy = {};

function act(c) {
	c.expected = {};
	c.tryGetById.expect(c.sut,id,strategy).return(c.expected);
	c.returned = c.sut.tryGetById(id,strategy);

	c.expectedExclusive = {};
	c.tryGetById.exclusive.expect(c.sut,id,strategy).return(c.expectedExclusive);
	c.returnedExclusive = c.sut.tryGetById.exclusive(id,strategy);
}

act.base = '../new';
module.exports = act;