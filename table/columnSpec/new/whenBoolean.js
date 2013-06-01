var when = require('a_test').when;
var c = {};

when('./boolean',c)
	.it('sets type').assertDoesNotThrow(c.bool.verify)
	.it('returns self').assertEqual(c.sut,c.returned);