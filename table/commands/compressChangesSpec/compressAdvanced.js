
var a  = require('a');
var mock = a.mock;

function act(c){	
	c.requireMock = a.requireMock;
	c.newParameterized = c.requireMock('../query/newParameterized');
	c.getSessionSingleton = c.requireMock('../getSessionSingleton');
	c.getSessionSingleton.expect('multipleStatements').return(true);
	
	c.q1 = {};
	c.q2 = {};
	c.q3 = {};
	c.queries = [c.q1, c.q3, c.q2 ];
	

	c.sql1 = '<sql1>';
	c.q1.sql = mock();
	c.q1.sql.expect().return(c.sql1);
	c.q1.parameters = [];

	c.sql2 = '<sql2>';
	c.q2.sql = mock();
	c.q2.sql.expect().return(c.sql2);
	c.q2.parameters = [];

	
	c.sql3 = '<sql3>';
	c.parameter3 = {};
	c.q3.sql = mock();
	c.q3.sql.expect().return(c.sql3);
	c.q3.parameters = [c.parameter3];

	c.expected = c.queries;

	c.returned = require('../compressChanges')(c.queries);
}


module.exports = act;