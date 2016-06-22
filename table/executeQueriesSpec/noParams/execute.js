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
	q1.parameters = [];	
	q1.sql = mock();
	c.sql1 = 'select whatever';
	q1.sql.expect().return(c.sql1);

	c.expected = {};
	c.change1 = {
		parameters: ['foo']
	};
	c.change2 = {
		parameters: []
	}
	c.change2.sql = mock();
	c.change2Sql = 'insert ...';
	c.change2.sql.expect().return(c.change2Sql);

	c.mergedQuery = {};
	c.newParameterized.expect(c.change2Sql + ';' + c.sql1, []).return(c.mergedQuery);
	
	c.changes = [c.change1, c.change2];
	c.changesPromise = {};
	c.queryResult = {};

	c.changesPromise.then = mock();
	c.changesPromise.then.expectAnything().whenCalled(onChangesPromise).return(c.expected);
	
	function onChangesPromise(next) {
		c.executeQueriesCoreResult = next();
	}

	popChanges.expect().return(c.changes);
	executeChanges.expect([c.change1]).return(c.changesPromise);
	executeQueriesCore.expect([c.mergedQuery, q2]).return(c.queryResult);
	c.returned = c.sut(queries);
}


module.exports = act;