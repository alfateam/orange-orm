var when = require('a').when;
var c = {};

when('./date',c).
	it('sets type').assertDoesNotThrow(c.date.verify).
	it('returns self').assertEqual(c.sut,c.returned);