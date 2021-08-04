var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.connectionLimit = {};
	c.pool = {
		config: {
			connectionLimit: c.connectionLimit
		}
	};
	
	c.poolOptions = {
		foo: {},
		bar: {}
	};
	c.returned = require('../../negotiatePoolOptions')(c.pool, c.poolOptions);
}

module.exports = act;