function act(c){
	
	c.relationName = 'child';
	c.parent = {};
	c.relation = {};
	c.getRelatives = c.mock();

	c.getRelativesPromise = c.then();
	c.getRelativesPromise.resolve(true);
	c.getRelatives.expect(c.parent, c.relation).return(c.getRelativesPromise);

	c.expandRows.expect(c.relationName);
	
	c.returned = c.sut.getRelatives(c.relationName, c.parent, c.relation, c.getRelatives).then(onOk,c.mock());

	function onOk() {		
	}
}

module.exports = act;