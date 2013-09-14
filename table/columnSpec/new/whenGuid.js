var when = require('a').when;
var c = {};

when('./guid',c).
	it('sets type').assertDoesNotThrow(c.guid.verify).
	it('returns self').assertEqual(c.sut,c.returned);