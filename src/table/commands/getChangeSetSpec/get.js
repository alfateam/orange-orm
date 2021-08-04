var a = require('a');
var expectRequire = a.expectRequire;

function act(c){
	c.changeSet = {};
	c.getSessionSingleton = a.requireMock('../getSessionSingleton');
	c.getSessionSingleton.expect('changes').return(c.changeSet);

	c.returned = require('../getChangeSet')();
}

module.exports = act;