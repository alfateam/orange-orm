var requireMock = require('a').requireMock;
var newJoinCore = requireMock('./newShallowJoinSqlCore');
var joinClause = '<joinClause>'

var rightTable = {};
var leftColumns = {};
var rightColumns = {};
var leftAlias = 'left';
var rightAlias = 'right';
var expected = ' JOIN table right ON (<joinClause>)';

function act(c) {
	rightTable._dbName = 'table';
	newJoinCore.expect(rightTable,leftColumns,rightColumns,leftAlias,rightAlias).return(joinClause);
	c.returned = require('../newShallowJoinSql')(rightTable,leftColumns,rightColumns,leftAlias,rightAlias);
	c.expected = expected;
}

module.exports = act;