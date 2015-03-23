var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	

	c.sut = require('../negotiateRawSqlFilter');

	c.newParameterized = c.requireMock('../query/newParameterized');
	c.newBoolean = c.requireMock('./newBoolean');
	
}

module.exports = act;