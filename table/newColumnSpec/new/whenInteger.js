var when = require('a_test').when;
var c = {};

when('./integer',c).
	it('sets type').assertEqual(c.expected,c.sut.type).
	it('returns self').assertEqual(c.sut,c.returned);