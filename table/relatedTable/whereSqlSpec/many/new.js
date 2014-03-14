var relation = {};
var joinSql = '<joinSql>';


function act(c){	
	c.expected = {};
	c.shallowFilter.prepend.expect(' WHERE <joinSql> AND ').return(c.expected);

	relation.accept = c.mock();
	relation.accept.expectAnything().whenCalled(onMany);

	function onMany(visitor) {
		visitor.visitMany(relation);
	}

	var rightTable = {};
	var leftColumns = {};
	var rightColumns = {};
	var joinRelation = {};
	var parentTable = {};
	relation.joinRelation = joinRelation;
	relation.childTable = rightTable;
	joinRelation.childTable = parentTable;
	joinRelation.columns = rightColumns;	
	parentTable._primaryColumns = leftColumns;				
	c.newShallowJoinSql.expect(rightTable,leftColumns,rightColumns,'_0','_1').return(joinSql);		
	
	c.returned = c.sut(relation,c.shallowFilter);
}

module.exports = act;