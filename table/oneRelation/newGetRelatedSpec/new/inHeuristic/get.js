function act(c){
	
	c.expected = {};
	c.heuristicPromise = c.then();
	c.heuristicPromise.resolve(c.expected);
	c.tryGetByHeuristic = c.mock();
	c.tryGetByHeuristic.expect(c.parent).return(c.heuristicPromise);
	c.relation.tryGetByHeuristic = c.tryGetByHeuristic;

	c.sut().then(onResult);

	function onResult(returned) {
		c.returned = returned;
	}
}

module.exports = act;