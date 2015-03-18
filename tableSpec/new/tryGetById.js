var id = {};
var expected = {};
var strategy = {};

function act(c) {
	c.expected = expected;
	c.tryGetById.expect(c.sut,id,strategy).return(c.expected);
	c.returned = c.sut.tryGetById(id,strategy);
}

act.base = '../new';
module.exports = act;