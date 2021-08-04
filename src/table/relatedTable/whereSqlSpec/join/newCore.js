var relation = {};
var joinSql = '<joinSql>';


function act(c){	
	c.relation = relation;	
	relation.accept = c.mock();
	relation.accept.expectAnything().whenCalled(onJoin);
	
	function onJoin(visitor) {
		visitor.visitJoin(relation);
	}
	
	c.joinLeftColumns = {};
	c.joinTable = {};
	c.joinRightColumns = {};
	c.joinTable._primaryColumns = c.joinRightColumns;
	c.parentTable = {
		_dbName: 'parent'
	};
	relation.childTable = c.joinTable;	
	relation.parentTable = c.parentTable;
	relation.columns = c.joinLeftColumns;

	c.newShallowJoinSql.expect(c.joinTable,c.joinLeftColumns,c.joinRightColumns,c.parentTable._dbName,'_1').return(joinSql);		
	

}

module.exports = act;