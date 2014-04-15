
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;

function act(c){		
	c.newParameterized = requireMock('../query/newParameterized');
	
	c.queries = [];
	
	c.expected = c.queries;

	c.returned = require('../compressChanges')(c.queries);
}


module.exports = act;