var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	c.table = {};
	c.db = {};
	c.filter = {};
	c.strategy = {};
	
	c.createReadStreamCore = c.requireMock('./createReadStreamCore');
	c.Stream = c.requireMock('stream');

	c.Stream.PassThrough = c.mock();
	c.transformer = {};
	c.Stream.PassThrough.expect({objectMode: true}).return(c.transformer);
	
	c.expected = {};
	c.createReadStreamCore.expect(c.table, c.db, c.filter, c.strategy, c.transformer).return(c.expected);

	c.returned = require('../createReadStream')(c.table, c.db, c.filter, c.strategy);

}

module.exports = act;