
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;
var executeQuery = requireMock('./executeQuery');

function act(c){		
	c.q1 = {};
	c.q2 = {};
	c.q3 = {};
	c.expected = {};
	c.queries = [c.q1, c.q2, c.q3];
	

	c.sql1 = '<sql1>';
	c.q1.sql = mock();
	c.q1.sql.expect().return(c.sql1);
	c.q1.parameters = [];

	c.sql2 = '<sql2>';
	c.q2.sql = mock();
	c.q2.sql.expect().return(c.sql2);
	c.q2.parameters = [];

	
	c.parameter3 = {};
	c.q3.parameters = [c.parameter3];

	c.secondQueryPromise = {};
	executeQuery.expect(c.q3).return(c.secondQueryPromise);

	function onSecondQuery(next) {
		c.secondResult = next();
	}


	c.compositeSql = '<sql1>;<sql2>';
	c.compositeQuery = {};
	c.expectedSecondResult = {};
	c.newParameterized = requireMock('../query/newParameterized');
	c.newParameterized.expect(c.compositeSql).return(c.compositeQuery);

	c.firstQueryPromise = {};
	c.firstQueryPromise.then = mock();
	executeQuery.expect(c.compositeQuery).return(c.firstQueryPromise);
	c.firstQueryPromise.then.expectAnything().whenCalled(onSecondQuery).return(c.expected);



	c.returned = require('../executeChanges')(c.queries);
}


module.exports = act;