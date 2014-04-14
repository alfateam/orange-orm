var a = require('a');

function act(c){
	c.mock = a.mock;
	c.getChangeSet = a.requireMock('./getChangeSet');
	c.changeSet = {};
	c.command = {};
	c.changeSet.push = c.mock();
	c.changeSet.push.expect(c.command);
	c.getChangeSet.expect().return(c.changeSet);
	require('../pushCommand')(c.command);
}

module.exports = act;