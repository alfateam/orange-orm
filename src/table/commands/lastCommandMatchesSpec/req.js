var a = require('a');
var requireMock = a.requireMock;

function act(c){
	c.mock = a.mock;
	c.getChangeSet = requireMock('./getChangeSet');

	c.sut = require('../lastCommandMatches');
}

module.exports = act;