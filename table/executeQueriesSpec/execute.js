var q1 = {};
var q2 = {};
var queries = [q1,q2];
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;
var executeQueriesCore = requireMock('./executeQueries/executeQueriesCore');
var flush = requireMock('./commands/flush');

function act(c){	
	c.expected = {};
	c.changesPromise = {};
	c.queryResult = {};

	c.changesPromise.then = mock();
	c.changesPromise.then.expectAnything().whenCalled(onChangesPromise).return(c.expected);
	
	function onChangesPromise(next) {
		c.executeQueriesCoreResult = next();
	}

	flush.expect().return(c.changesPromise);
	executeQueriesCore.expect(queries).return(c.queryResult);
	c.returned = require('../executeQueries')(queries);
}


module.exports = act;