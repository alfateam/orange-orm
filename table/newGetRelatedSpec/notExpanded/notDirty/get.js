function act(c){
	
	c.expected = {};

	c.isDirty.expect().return(false);
	
	c.relativesPromise = c.then();
	c.relativesPromise.resolve();
	c.getRelatives = c.mock();
	c.getRelatives.expect(c.parent).return(c.relativesPromise);
	c.relation.getRelatives = c.getRelatives;

	c.relation.getFromCache = c.mock();
	c.relation.getFromCache.expect(c.parent).return(c.expected);

	c.sut().then(onResult);

	function onResult(returned) {
		c.returned = returned;
	}
}

module.exports = act;