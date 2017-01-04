var filter = {} ,
	strategy = {};

function act(c){
	c.expected = {};
	c.tryGetFirstFromDb.expect(c.sut, filter, strategy).return(c.expected);
	c.returned = c.sut.tryGetFirst(filter, strategy);

	c.expectedExclusive = {};
	c.tryGetFirstFromDb.exclusive.expect(c.sut, filter, strategy).return(c.expectedExclusive);
	c.returnedExclusive = c.sut.tryGetFirst.exclusive(filter, strategy);
}

module.exports = act;