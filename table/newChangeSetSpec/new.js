var a = require('a');
var expectRequire = a.expectRequire;

function act(c){
	c.changeSetId = 'someId';
	expectRequire('./commands/changeSetId').return(c.changeSetId);
	c.domain = {};
	process.domain = c.domain;

	c.sut = require('../newChangeSet')();
}

module.exports = act;