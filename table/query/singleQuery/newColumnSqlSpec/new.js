var requireMock = require('a_mock').requireMock;
var newShallowColumnSql = requireMock('./columnSql/newShallowColumnSql');
var newJoinedColumnSql = requireMock('./columnSql/newJoinedColumnSql');

var columnSql = '<columnSql>';
var joinedColumnSql = '<joinedColumnSql>';
var table = {};
var span = {};
var alias = '_2';
var span = {};

function act(c) {
	newShallowColumnSql.expect(table,alias).return(columnSql);
	newJoinedColumnSql.expect(span,alias).return(joinedColumnSql);
	c.returned = require('../newColumnSql')(table,span,alias);
	c.expected = '<columnSql><joinedColumnSql>';

}

module.exports = act;