var when = require('a').when;
var c = {};

when('./json',c).
	it('sets type').assertDoesNotThrow(c.json.verify).
	it('returns self').assertEqual(c.sut,c.returned);