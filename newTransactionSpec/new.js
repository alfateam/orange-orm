var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.begin = requireMock('./table/begin');
	c.pg = requireMock('pg.js');
	c.pg.connect = mock();

	c.domain = {};
	c.domain.run = mock();
	c.run = function() {};
	c.domain.run.expectAnything().whenCalled(onRun);

	function onRun(run)	 {
		c.run = run;
	}

	c.sut = require('../newTransaction')(c.domain, c.connectionString);
}

module.exports = act;