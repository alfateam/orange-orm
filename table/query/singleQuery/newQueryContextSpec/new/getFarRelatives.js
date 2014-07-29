function act(c){
	
	c.relationName = 'child';
	c.parent = {};
	c.relation = {};
	c.getFarRelatives = c.mock();

	c.getFarRelativesPromise = c.then();
	c.getFarRelativesPromise.resolve(true);
	c.getFarRelatives.expect(c.parent, c.relation).return(c.getFarRelativesPromise);

	c.expandRows.expect(c.relationName);
	
	c.returned = c.sut.getFarRelatives(c.relationName, c.parent, c.relation, c.getFarRelatives).then(onOk,c.mock());

	function onOk() {		
	}
}

module.exports = act;