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
	c.streamOptions = {};
	
	c.createReadStreamCore = c.requireMock('./createReadStreamCore');
	c.Stream = c.requireMock('stream');

	c.Stream.Transform = c.mock();
	c.transformer = {};
	c.Stream.Transform.expect({objectMode: true}).return(c.transformer);
	
	c.expected = {};
	c.createReadStreamCore.expect(c.table, c.db, c.filter, c.strategy, c.transformer, c.streamOptions).return(c.expected);

	c.returned = require('../createJSONReadStream')(c.table, c.db, c.filter, c.strategy, c.streamOptions);
}

module.exports = act;