var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;

	c.id = 'someId';
	c.pools = {};
	c.pools[c.id] = {};
	c.expectRequire('../../pools').return(c.pools);
	
	c.mysqlPool = {};
	c.done = c.mock();
	
	c.mysqlPool.end = c.mock();
	c.mysqlPool.end.expectAnything().whenCalled(onEnd);


	c.endCompleted = function() {};

	function onEnd(endCompleted) {
		c.endCompleted = endCompleted;	
	}
	
	require('../end')(c.mysqlPool, c.id, c.done);
}

module.exports = act;