var relation = {},
	relation2 = {};
	relation3 = {};
var relations = [relation,relation2,relation3];
var shallowFilter = {};
var selectSql = {},
	joinSql = {},
	whereSql = {};
var alias = '_' + (relations.length -1);
var childTable = {};
var tempFilter = {};
var tempFilter2 = {};
var tempFilter3 = {};

function act(c){
	var mock = c.mock;
	c.expected = {};

	relation.childTable = childTable;
	c.newSelectSql.expect(childTable,alias).return(selectSql);

	c.newJoinSql.expect([relation2, relation3]).return(joinSql);

	c.newWhereSql.expect(relations,shallowFilter).return(whereSql);

	selectSql.prepend = mock();
	selectSql.prepend.expect('EXISTS (').return(tempFilter);
	
	tempFilter.append = mock();
	tempFilter.append.expect(joinSql).return(tempFilter2);

	tempFilter2.append = mock();
	tempFilter2.append.expect(whereSql).return(tempFilter3);

	tempFilter3.append = mock();
	tempFilter3.append.expect(')').return(c.expected);

	c.returned = c.sut(relations,shallowFilter);
}

module.exports = act;