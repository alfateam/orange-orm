var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.query = {
		sql: "sql",
		parameters: "parameters"
	};

	c.negotiateSql = c.requireMock('./negotiateSql');
	c.negotiateParameters = c.requireMock('./negotiateParameters');
	
	c.safeSql = {};
	c.negotiateSql.expect(c.query).return(c.safeSql);

	c.safeParameters = {};
	c.negotiateParameters.expect(c.query.parameters).return(c.safeParameters);

	c.returned = require('../wrapQuery')(c.query);
}

module.exports = act;