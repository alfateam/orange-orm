function act(c) {	
	c.joinRelation = {};
	c.newJoinRelation.expect(c.parentTable, c.childTable,['foo','baz','bar']).return(c.joinRelation);

	c.returned = c.sut(c.parentTable, c.childTable).by('foo','baz').by('bar').as('child');
}

module.exports = act;