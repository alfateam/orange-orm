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

	c.key = 'someKey';
	c.connectionString.toJSON = function() {
		return c.key;
	};
	
	c.pg.pools = {};
	c.pg.pools.all = {};	
	c.pg.pools.all[JSON.stringify(c.key)] = c.pgPool;

	require('../end')(c.connectionString, c.pgPool, c.pg, c.endCompleted);
}

module.exports = act;