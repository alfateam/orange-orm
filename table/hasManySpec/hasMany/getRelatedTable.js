function act(c){	
	c.expected = {};
	c.newRelatedTable.expect([c.manyRelation]).return(c.expected);
	c.returned = c.parentTable.child;
}

module.exports = act;