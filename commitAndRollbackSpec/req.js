var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.commit = requireMock('./table/commit');
	c.rollback = requireMock('./table/rollback');
	c.success = mock();
	c.failed = mock();
	c.success.expect(c.commit, c.rollback);

	c.resolve = require('../commitAndRollback');
	c.resolve(c.success, c.failed)
}

module.exports = act;