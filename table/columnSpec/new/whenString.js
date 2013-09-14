var when = require('a').when;
var c = {};

when('./string',c).
	it('sets type').assertDoesNotThrow(c.string.verify).
	it('returns self').assertEqual(c.sut,c.returned);