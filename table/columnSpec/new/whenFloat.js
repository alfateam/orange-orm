var when = require('a_test').when;
var c = {};

when('./float',c)
	.it('sets type').assertDoesNotThrow(c.float.verify)
	.it('returns self').assertEqual(c.sut,c.returned);