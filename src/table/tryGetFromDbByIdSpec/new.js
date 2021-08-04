var a = require('a');

function act(c) {
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.tryGetFirstFromDb = c.requireMock('./tryGetFirstFromDb');
	c.tryGetFirstFromDb.exclusive = c.mock();
	c.newPrimaryKeyFilter = c.requireMock('./newPrimaryKeyFilter');
	c.extractStrategy = c.requireMock('./tryGetFromDbById/extractStrategy');
	
	c.sut = require('../tryGetFromDbById');
}


module.exports = act;