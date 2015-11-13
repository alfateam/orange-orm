var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.transformer.push = c.mock();
	c.chunk = {a: 1, b:2};
	c.enc = {};
	c.cb = c.mock();
	c.cb.expect();

	c.transformer.push.expect(JSON.stringify(c.chunk));

	c.transformer._transform(c.chunk, c.enc, c.cb);
}

module.exports = act;