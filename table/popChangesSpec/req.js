var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var expectRequire = a.expectRequire;

function act(c){
	c.mock = mock;		
	c.changeSetId = 'cid';
	expectRequire('./commands/changeSetId').return(c.changeSetId);
	c.domain = {};
	process.domain = c.domain;
	c.sut = require('../popChanges');
}

module.exports = act;