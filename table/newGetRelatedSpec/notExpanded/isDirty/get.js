function act(c){
	
	c.expected = {};

	c.isDirty.expect().return(true);
	
	c.dbPromise = c.then();
	c.dbPromise.resolve(c.expected);
	c.getFromDb = c.mock();
	c.getFromDb.expect(c.parent).return(c.dbPromise);
	c.relation.getFromDb = c.getFromDb;

	c.sut().then(onResult);

	function onResult(returned) {
		c.returned = returned;
	}
}

module.exports = act;