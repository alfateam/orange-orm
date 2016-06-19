var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.query = {};
	c.dbClient = {};

	c.getChangeSet = requireMock('../commands/getChangeSet');
	c.prevQueryCount = 2;
	c.queryCount = 10;
	c.changeSet = {
		queryCount: c.queryCount
	};
	c.getChangeSet.expect().return(c.changeSet);
		
	c.getSessionSingleton = requireMock('../getSessionSingleton');
	c.getSessionSingleton.expect('dbClient').return(c.dbClient);	

	c.queryContext = {};
	c.query.queryContext = c.queryContext;

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