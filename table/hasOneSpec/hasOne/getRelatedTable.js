function act(c){	
	c.expected = {};
	c.newRelatedTable.expect([c.oneRelation]).return(c.expected);
	c.returned = c.parentTable.child;
}

module.exports = act;