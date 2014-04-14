var a = require('a');
var expectRequire = a.expectRequire;

function act(c){
	c.changeSet = {};
	c.changeSetId = 'someId';	
	c.domain = {};
	c.domain[c.changeSetId] = c.changeSet;
	process.domain = c.domain;

	expectRequire('./changeSetId').return(c.changeSetId);

	c.returned = require('../getChangeSet')();
}

module.exports = act;