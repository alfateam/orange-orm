var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var relation = {},
	relation2 = {};
var relations = [relation,relation2];
var shallowFilter = {};
var selectSql = {},
	joinSql = {},
	whereSql = {};
var newSelectSql = requireMock('./selectSql');
var newJoinSql = requireMock('./joinSql');
var newWhereSql = requireMock('./whereSql');
var childTable = {};
var alias = '_2';
var tempFilter = {};
var tempFilter2 = {};
var tempFilter3 = {};

function act(c){
	c.expected = {};

	relation2.childTable = childTable;
	newSelectSql.expect(childTable,alias).return(selectSql);

	newJoinSql.expect(relations).return(joinSql);

	newWhereSql.expect(relation,shallowFilter).return(whereSql);

	selectSql.prepend = mock();
	selectSql.prepend.expect('EXISTS (').return(tempFilter);
	
	tempFilter.append = mock();
	tempFilter.append.expect(joinSql).return(tempFilter2);

	tempFilter2.append = mock();
	tempFilter2.append.expect(whereSql).return(tempFilter3);

	tempFilter3.append = mock();
	tempFilter3.append.expect(')').return(c.expected);

	c.returned = require('../subFilter')(relations,shallowFilter);
}

module.exports = act;