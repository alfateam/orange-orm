var relation = {};
var joinSql = '<joinSql>';


function act(c){	
	c.rightAlias = {};
	c.relation = relation;	
	relation.accept = c.mock();
	relation.accept.expectAnything().whenCalled(onJoin);
	
	function onJoin(visitor) {
		visitor.visitJoin(relation);
	}
	
	c.relations = [c.relation, {}, {}];

	c.joinLeftColumns = {};
	c.joinTable = {};
	c.joinRightColumns = {};
	c.joinTable._primaryColumns = c.joinRightColumns;
	relation.childTable = c.joinTable;
	relation.columns = c.joinLeftColumns;
	c.newShallowJoinSql.expect(c.joinTable,c.joinLeftColumns,c.joinRightColumns,'_3',c.rightAlias).return(joinSql);		
	

}

module.exports = act;