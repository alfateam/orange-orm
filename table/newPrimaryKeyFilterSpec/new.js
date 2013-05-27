var a = require('a_mock'),
	mock = a.mock,
	requireMock = a.requireMock,
	expectRequire = a.expectRequire,
	key1 = {},
	key2 = {},
	column1 = {},
	column2 = {},
	primaryColumns = [column1,column2],
	table = {},
	keyFilter1 = {},
	keyFilter2 = {},
	filter = {},
	strategy = {};

table.primaryColumns = primaryColumns; 
expectRequire('./filter').return(filter);

function act(c) {
	c.filter = filter;
	column1.equal = mock();
	column1.equal.expect(key1).return(keyFilter1);
	column2.equal = mock();
	column2.equal.expect(key2).return(keyFilter2);
	keyFilter1.and = mock();
	keyFilter1.and.expect(keyFilter2).return(filter);
	c.sut = require('../newPrimaryKeyFilter');		
	c.returned = c.sut(table,key1,key2,strategy);
}

module.exports = act;