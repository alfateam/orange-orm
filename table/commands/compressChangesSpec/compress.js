
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;

function act(c){		
	c.newParameterized = requireMock('../query/newParameterized');

	c.q1 = {};
	c.q2 = {};
	c.q3 = {};
	c.queries = [c.q1, c.q2, c.q3 ];
	

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

	c.compositeSql = '<sql1>;<sql2>';
	c.compositeQuery = {};
	
	c.newParameterized.expect(c.compositeSql).return(c.compositeQuery);

	c.expected = [c.compositeQuery, c.q3];

	c.returned = require('../compressChanges')(c.queries);
}


module.exports = act;