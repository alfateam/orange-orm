var a = require('a');

function act(c) {
	c.requireMock = a.requireMock;
	c.mock = a.mock;
	c.getMany = c.requireMock('./getMany');
	c.util = c.requireMock('util');
	
	
	c.getMany.exclusive = c.mock();
	
	c.table = 't';
	c.filter = 'f';
	c.initialStrategy = 's';
	c.strategy = {};

	c.util._extend = c.mock();
	c.util._extend.expect({limit: 1}, c.initialStrategy).return(c.strategy);
	
	c.sut = require('../tryGetFirstFromDb');
}

module.exports = act;