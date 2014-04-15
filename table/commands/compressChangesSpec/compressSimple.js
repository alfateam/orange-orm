
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;

function act(c){		
	c.newParameterized = requireMock('../query/newParameterized');
	
	c.q1 = {};
	c.queries = [c.q1];
	

	c.sql1 = '<sql1>';
	c.q1.sql = mock();
	c.q1.sql.expect().return(c.sql1);
	c.q1.parameters = [];


	c.expected = [c.q1];

	c.returned = require('../compressChanges')(c.queries);
}


module.exports = act;