var id = {};
var expected = {};
var strategy = {};

function act(c) {
	c.expected = expected;
	c.getById.expect(c.sut,id,strategy).return(c.expected);
	c.returned = c.sut.getById(id,strategy);
}

act.base = '../new';
module.exports = act;