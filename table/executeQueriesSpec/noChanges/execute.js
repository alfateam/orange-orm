var q1 = {};
var q2 = {};
var queries = [q1,q2];
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;
var executeQueriesCore = requireMock('./executeQueries/executeQueriesCore');
var executeChanges = requireMock('./executeQueries/executeChanges');
var popChanges = requireMock('./popChanges');

function act(c){	
	c.expected = {};
	c.changes = [];
	c.changesPromise = {};
	c.queryResult = {};

	c.changesPromise.then = mock();
	c.changesPromise.then.expectAnything().whenCalled(onChangesPromise).return(c.expected);
	
	function onChangesPromise(next) {
		c.executeQueriesCoreResult = next();
	}

	popChanges.expect().return(c.changes);
	executeChanges.expect(c.changes).return(c.changesPromise);
	executeQueriesCore.expect(queries).return(c.queryResult);
	c.returned = c.sut(queries);
}


module.exports = act;