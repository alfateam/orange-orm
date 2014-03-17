var relation = {};
var joinSql = '<joinSql>';


function act(c){	
	c.expected = {};
	c.shallowFilter.prepend.expect(' WHERE <joinSql> AND ').return(c.expected);
		
	relation.accept = c.mock();
	relation.accept.expectAnything().whenCalled(onJoin);
	
	function onJoin(visitor) {
		visitor.visitJoin(relation);
	}
	
	c.joinLeftColumns = {};
	c.joinTable = {};
	c.joinRightColumns = {};
	c.joinTable._primaryColumns = c.joinRightColumns;
	relation.childTable = c.joinTable;
	relation.columns = c.joinLeftColumns;
	c.newShallowJoinSql.expect(c.joinTable,c.joinLeftColumns,c.joinRightColumns,'_0','_1').return(joinSql);		
	
	c.returned = c.sut(relation,c.shallowFilter);
}

module.exports = act;