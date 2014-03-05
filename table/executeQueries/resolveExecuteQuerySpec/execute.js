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

	c.sql = {};
	c.parameters = {};

	c.query.sql = mock();
	c.query.sql.expect().return(c.sql);
	
	c.parameterCollection = {};
	c.query.parameters = mock();
	c.query.parameters.expect().return(c.parameterCollection);

	c.parameterCollection.toArray = mock();
	c.parameterCollection.toArray.expect().return(c.parameters);

	c.dbClient.query = c.mock();
	c.dbClient.query.expect(c.sql, c.parameters).expectAnything().whenCalled(onQuery);

	function onQuery(sql, parameters, handler) {
		c.queryCompleted = handler;
	}

	c.onSuccess = c.mock();
	c.onFailed = c.mock();
	require('../resolveExecuteQuery')(c.query)(c.onSuccess,c.onFailed);
}

module.exports = act;