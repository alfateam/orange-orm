var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.query = {};
	c.dbClient = {};

	c.log = requireMock('../log');
	c.log.expect(c.query);
	
	c.getSessionSingleton = requireMock('../getSessionSingleton');
	c.getSessionSingleton.expect('dbClient').return(c.dbClient);	

	c.dbClient.executeQuery = c.mock();
	c.dbClient.executeQuery.expect(c.query).expectAnything().whenCalled(onQuery);

	function onQuery(query, handler) {
		c.queryCompleted = handler;
	}

	c.onSuccess = c.mock();
	c.onFailed = c.mock();
	require('../resolveExecuteQuery')(c.query)(c.onSuccess,c.onFailed);
}

module.exports = act;