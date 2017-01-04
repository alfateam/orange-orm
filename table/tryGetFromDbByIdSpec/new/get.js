var optionalStrategy = {},
	strategy = {},
	filter = {},
	arg1 = {},
	arg2 = {},
	table = {},
	expected = {};

function act(c) {
	c.newPrimaryKeyFilter.expect(table,arg1,arg2,optionalStrategy).return(filter);
	c.extractStrategy.expect(table,arg1,arg2,optionalStrategy).return(strategy);
	c.tryGetFirstFromDb.expect(table,filter,strategy).return(expected)
	c.expected = expected;
	c.returned = c.sut(table,arg1,arg2,optionalStrategy);
}

module.exports = act;