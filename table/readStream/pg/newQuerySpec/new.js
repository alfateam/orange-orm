var a = require('a');
var table = {};
var filter = {};
var orderBy = {};
var span = {};
var alias = '_2';
var expected = {};

function act(c) {
	c.mock = a.mock;
	c.requireMock = a.requireMock;

	c.newQueryCore = c.requireMock('./newQueryCore');

	c.expected = {};

	c.queryCore = {};
	c.newQueryCore.expect(table,filter,span,alias,orderBy).return(c.queryCore);

	c.queryCore.prepend = c.mock();
	c.prepended = {};
	c.queryCore.prepend.expect('select row_to_json(r)::text as result from (').return(c.prepended);

	c.prepended.append = c.mock();
	c.prepended.append.expect(') r').return(c.expected);
	
	c.returned = require('../newQuery')(table,filter,span,alias,orderBy);
}

module.exports = act;
