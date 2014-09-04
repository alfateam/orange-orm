function act(c){		
	c.joinRelation = {};
	c.queryContext = {};
	c.child.queryContext = c.queryContext;
	c.relation.joinRelation = c.joinRelation;

	c.child.queryContext.expand = c.mock();
	c.child.queryContext.expand.expect(c.joinRelation);

	c.negotiate();
}

module.exports = act;