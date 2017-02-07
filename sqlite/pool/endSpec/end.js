var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;

	c.id = 'someId';
	c.pools = {};
	c.pools[c.id] = {};
	c.expectRequire('../../pools').return(c.pools);
	
	c.pgPool = {};
	c.endCompleted = c.mock();
	
	c.pgPool.drain = c.mock();
	c.pgPool.drain.expectAnything().whenCalled(onDrain);


	c.drainCompleted = function() {};

	function onDrain(drainCompleted) {
		c.drainCompleted = drainCompleted;	
	}
	
	require('../end')(c.pgPool, c.id, c.endCompleted);
}

module.exports = act;