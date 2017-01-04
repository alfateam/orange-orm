var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var then = a.then;

function act(c){
	c.wrapQuery = requireMock('./query/wrapQuery');
	c.executeQueries = requireMock('./table/executeQueries');
	
	c.query = {};

	c.wrappedQuery = {};
	c.wrapQuery.expect(c.query).return(c.wrappedQuery);

	c.expected = {};
	c.queriesPromise = then();
	c.queriesPromise.resolve([c.expected]);
	c.executeQueries.expect([c.wrappedQuery]).return(c.queriesPromise);
	
	require('../query')(c.query).then(storeResult);

	function storeResult(result) {
		c.returned = result;
	}
}

module.exports = act;