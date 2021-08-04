function act(c){		
	c.joinRelation = {};
	c.relation.joinRelation = c.joinRelation;
	c.children = [];
	c.negotiate();
}

module.exports = act;