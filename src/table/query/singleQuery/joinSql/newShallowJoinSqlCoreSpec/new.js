var requireMock = require('a').requireMock;
var newDiscriminatorSql = requireMock('./newDiscriminatorSql');

var rightTable = {};
rightTable._dbName = 'table';
var leftColumn1 = {};
leftColumn1._dbName = 'lcolumn1';
var leftColumn2 = {};
leftColumn2._dbName = 'lcolumn2';
var rightColumn1 = {};
rightColumn1._dbName = 'rcolumn1';
var rightColumn2 = {};
rightColumn2._dbName = 'rcolumn2';
var leftColumns = [leftColumn1,leftColumn2];
var rightColumns = [rightColumn1,rightColumn2];
var leftAlias = 'left';
var rightAlias = 'right';
var discriminatorSql = ' AND <discriminatorSql>';
var expected = 'left.lcolumn1=right.rcolumn1 AND left.lcolumn2=right.rcolumn2 AND <discriminatorSql>';
function act(c) {
	newDiscriminatorSql.expect(rightTable,rightAlias).return(discriminatorSql);
	c.returned = require('../newShallowJoinSqlCore')(rightTable,leftColumns,rightColumns,leftAlias,rightAlias);
	c.expected = expected;
}

module.exports = act;