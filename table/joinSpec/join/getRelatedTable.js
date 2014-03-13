function act(c){	
	c.expected = {};
	c.newRelatedTable.expect([c.joinRelation]).return(c.expected);
	c.returned = c.parentTable.child;
}

module.exports = act;