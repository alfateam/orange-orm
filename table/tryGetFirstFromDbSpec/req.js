var a = require('a');

function act(c) {
	c.requireMock = a.requireMock;
	c.mock = a.mock;
	c.getMany = c.requireMock('./getMany');
	c.getMany.exclusive = c.mock();
	
	c.table = 't';
	c.filter = 'f';
	c.strategy = 's';
	
	c.sut = require('../tryGetFirstFromDb');
}

module.exports = act;