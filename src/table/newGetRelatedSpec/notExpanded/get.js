function act(c){
	
	c.expected = {};

	c.relativesPromise = c.then();
	c.relativesPromise.resolve();
	c.getRelatives = c.mock();
	c.getRelatives.expect(c.parent).return(c.relativesPromise);
	c.relation.getRelatives = c.getRelatives;

	c.relation.getFromDb = c.mock();
	c.relation.getFromDb.expect(c.parent).resolve(c.expected);

	c.sut().then(onResult);

	function onResult(returned) {
		c.returned = returned;
	}
}

module.exports = act;