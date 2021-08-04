var a  = require('a');
var mock = a.mock;

function act(c){		
	c.requireMock = a.requireMock;
	c.newParameterized = c.requireMock('../query/newParameterized');
	c.getSessionSingleton = c.requireMock('../getSessionSingleton');
	c.getSessionSingleton.expect('multipleStatements').return(true);
	
	c.queries = [];
	
	c.expected = c.queries;

	c.returned = require('../compressChanges')(c.queries);
}


module.exports = act;