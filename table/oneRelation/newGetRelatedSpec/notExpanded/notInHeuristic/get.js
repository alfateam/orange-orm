function act(c){
	
	c.expected = {};

	c.getFromDbPromise = c.then();
	c.getFromDbPromise.resolve(c.expected);
	c.getFromDb = c.mock();
	c.getFromDb.expect(c.parent).return(c.getFromDbPromise);
	c.relation.getFromDb = c.getFromDb;

	c.heuristicPromise = c.then();
	c.heuristicPromise.resolve();
	c.tryGetByHeuristic = c.mock();
	c.tryGetByHeuristic.expect(c.parent).return(c.heuristicPromise);
	c.relation.tryGetByHeuristic = c.tryGetByHeuristic;

	c.sut().then(onResult);

	function onResult(returned) {
		c.returned = returned;
	}
}

module.exports = act;