var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.query = {};
	c.dbClient = {};
	c.domain = {};
	process.domain = c.domain;;	
	c.domain.dbClient = c.dbClient;

	c.queryContext = {};
	c.query.queryContext = c.queryContext;

	c.dbClient.query = c.mock();
	c.dbClient.query.expect(c.query).expectAnything().whenCalled(onQuery);

	function onQuery(query, handler) {
		c.queryCompleted = handler;
	}

	c.onSuccess = c.mock();
	c.onFailed = c.mock();
	require('../resolveExecuteQuery')(c.query)(c.onSuccess,c.onFailed);
}

module.exports = act;