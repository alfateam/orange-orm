var q1 = {};
var q2 = {};
var queries = [q1,q2];
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;

function act(c){	
	c.expected = {};
	c.change1 = {};
	c.change2 = {
		parameters: ['para']
	}
	c.changes = [c.change1, c.change2];
	c.changesPromise = {};
	c.queryResult = {};

	c.changesPromise.then = mock();
	c.changesPromise.then.expectAnything().whenCalled(onChangesPromise).return(c.expected);
	
	function onChangesPromise(next) {
		c.executeQueriesCoreResult = next();
	}

	c.popChanges.expect().return(c.changes);
	c.executeChanges.expect(c.changes).return(c.changesPromise);
	c.executeQueriesCore.expect(queries).return(c.queryResult);

	c.returned = c.sut(queries);
}

module.exports = act;