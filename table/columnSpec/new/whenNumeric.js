var when = require('a').when;
var c = {};

when('./numeric',c).
	it('sets type').assertDoesNotThrow(c.numeric.verify).
	it('returns self').assertEqual(c.sut,c.returned);