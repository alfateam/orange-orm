var requireMock = require('a').requireMock;
var newPrimaryKeyFilter = requireMock('./newPrimaryKeyFilter');
var tryGetFirstFromDb = requireMock('./tryGetFirstFromDb');
var extractStrategy = requireMock('./tryGetFromDbById/extractStrategy');

function act(c) {
	c.sut = require('../tryGetFromDbById');
	c.tryGetFirstFromDb = tryGetFirstFromDb;
	c.newPrimaryKeyFilter = newPrimaryKeyFilter;
	c.extractStrategy = extractStrategy;
}


module.exports = act;