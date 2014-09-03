function act(c){
	c.strategy = {};	
	c.table = {};

	c.manyTable = {};
	c.manyRelation = {};
	c.manyRelation.childTable = c.manyTable;

	c.oneRelation = {};
	c.oneTable = {};
	c.oneRelation.childTable = c.oneTable;

	c.joinRelation = {};

	c.relations = {manyRelation : c.manyRelation, oneRelation: c.oneRelation, joinRelation: c.joinRelation};
	c.manyStrategy = {};
	c.oneStrategy = {};
	c.expected = {manyRelation: c.manyStrategy, oneRelation: c.oneStrategy};

	c.manyRelation.accept = c.mock();
	c.manyRelation.accept.expectAnything().whenCalled(function(visitor) {
		visitor.visitMany(c.manyRelation);
	});

	c.oneRelation.accept = c.mock();
	c.oneRelation.accept.expectAnything().whenCalled(function(visitor) {
		visitor.visitOne(c.oneRelation);
	});

	c.joinRelation.accept = c.mock();
	c.joinRelation.accept.expectAnything().whenCalled(function(visitor) {
		visitor.visitJoin(c.joinRelation);
	});

	c.newObject.expect().return(c.manyStrategy);
	c.newObject.expect().return(c.oneStrategy);

	c.newNextCascadeDeleteStrategy = c.requireMock('./newCascadeDeleteStrategy');
	c.newNextCascadeDeleteStrategy.expect(c.manyStrategy, c.manyTable);
	c.newNextCascadeDeleteStrategy.expect(c.oneStrategy, c.oneTable);
	
	
	c.table._relations = c.relations;
	c.returned = c.sut(c.strategy,c.table);
}

module.exports = act;