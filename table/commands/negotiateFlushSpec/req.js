var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.getChangeSet = c.requireMock('./getChangeSet');
	c.flush = c.requireMock('./flush');

	c.changeSet = {};
	c.getChangeSet.expect().return(c.changeSet);

	c.sut = require('../negotiateFlush');
}

module.exports = act;