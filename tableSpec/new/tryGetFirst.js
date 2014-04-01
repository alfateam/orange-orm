var filter = {} ,
	strategy = {};

function act(c){
	c.expected = {};
	c.tryGetFirstFromDb.expect(c.sut, filter, strategy).return(c.expected);
	c.returned = c.sut.tryGetFirst(filter, strategy);
}

module.exports = act;