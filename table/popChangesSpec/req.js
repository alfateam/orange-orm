var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var expectRequire = a.expectRequire;

function act(c){
	c.mock = mock;		
	c.changeSetId = 'cid';
	c.getChangeSet = requireMock('./commands/getChangeSet');
	c.compressChanges = requireMock('./commands/compressChanges');
	c.sut = require('../popChanges');
}

module.exports = act;