function act(c) {	
	c.joinRelation = {};

	try {
		c.sut(c.parentTable, c.childTable).by('foo','someColumn').by('bar').as('child');		
	}
	catch (e) {
		c.thrownMessage = e.message;
	}
}

module.exports = act;