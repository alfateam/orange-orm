var when = require('a').when;
var c = {};

when('./binary',c)
	.it('sets type').assertDoesNotThrow(c.binary.verify)
	.it('returns self').assertEqual(c.sut,c.returned);