function act(c){
	c.childTable = 'childT';
	c.childTable2 = 'childT2';
	
	c.newRelatedTable = c.requireMock('./newRelatedTable');	

	c.newRelatedTable.expect([c.relation, c.relation2, c.childRelation]).return(c.childTable);	
	c.newRelatedTable.expect([c.relation, c.relation2, c.childRelation2]).return(c.childTable2);	
	
	c.returnedChild = c.sut.child;
	c.returnedChild2 = c.sut.child2;
}

module.exports = act;