var when = require('a').when;
var c = {};

when('./integer',c).
	it('sets type').assertDoesNotThrow(c.integer.verify).
	it('returns self').assertEqual(c.sut,c.returned);