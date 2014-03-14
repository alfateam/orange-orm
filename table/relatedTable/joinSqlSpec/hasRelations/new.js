var relation = {},
	joinRelation = {},
	oneRelation = {},
	manyRelation = {};
var joinSql = ' <joinSql>';
var oneSql = ' <oneSql>';
var manySql = ' <manySql>';

function act(c){	
	c.expected = ' INNER <joinSql> INNER <oneSql> INNER <manySql>'
	stubJoin();
	stubOne();
	stubMany();

	function stubJoin() {
		joinRelation.accept = c.mock();
		joinRelation.accept.expectAnything().whenCalled(onJoin);
	
		function onJoin(visitor) {
			visitor.visitJoin(joinRelation);
		}
	
		c.joinLeftColumns = {};
		c.joinTable = {};
		c.joinRightColumns = {};
		c.joinTable._primaryColumns = c.joinRightColumns;
		joinRelation.childTable = c.joinTable;
		joinRelation.columns = c.joinLeftColumns;
		c.newShallowJoinSql.expect(c.joinTable,c.joinLeftColumns,c.joinRightColumns,'_0','_1').return(joinSql);
	}

	function stubOne() {
		oneRelation.accept = c.mock();
		oneRelation.accept.expectAnything().whenCalled(onOne);

		function onOne(visitor) {
			visitor.visitOne(oneRelation);
		}
		var rightTable = {};
		var leftColumns = {};
		var rightColumns = {};
		var joinRelation = {};
		var parentTable = {};
		oneRelation.joinRelation = joinRelation;
		oneRelation.childTable = rightTable;
		joinRelation.childTable = parentTable;
		joinRelation.columns = rightColumns;	
		parentTable._primaryColumns = leftColumns;				
		c.newShallowJoinSql.expect(rightTable,leftColumns,rightColumns,'_1','_2').return(oneSql);		
	}

	function stubMany() {
		manyRelation.accept = c.mock();
		manyRelation.accept.expectAnything().whenCalled(onMany);

		function onMany(visitor) {
			visitor.visitMany(manyRelation);
		}

		var rightTable = {};
		var leftColumns = {};
		var rightColumns = {};
		var joinRelation = {};
		var parentTable = {};
		manyRelation.joinRelation = joinRelation;
		manyRelation.childTable = rightTable;
		joinRelation.childTable = parentTable;
		joinRelation.columns = rightColumns;	
		parentTable._primaryColumns = leftColumns;				
		c.newShallowJoinSql.expect(rightTable,leftColumns,rightColumns,'_2','_3').return(manySql);		
	}
	
	c.returned = c.sut([relation,joinRelation,oneRelation,manyRelation]);
}

module.exports = act;