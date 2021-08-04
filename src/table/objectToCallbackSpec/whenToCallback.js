var a = require('a');
var mock = a.mock;
var when = a.when;
var c = {};

function act(c) {
	c.object = {};
	c.sut = require('../objectToCallback')(c.object);
	c.onResolve = mock();
	c.onResolve.expect(c.object);
	c.sut(c.onResolve);
}

when(act,c).
	it('should invoke with object').assertDoesNotThrow(c.onResolve.verify);
