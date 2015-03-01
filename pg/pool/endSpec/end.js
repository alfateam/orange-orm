var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	
	c.connectionString = {};
	c.pgPool = {};
	c.pg = {};
	c.endCompleted = c.mock();
	
	c.pgPool.drain = c.mock();
	c.pgPool.drain.expectAnything().whenCalled(onDrain);

	c.drainCompleted = function() {};

	function onDrain(drainCompleted) {
		c.drainCompleted = drainCompleted;	
	}
	
	require('../end')(c.connectionString, c.pgPool, c.pg, c.endCompleted);
}

module.exports = act;