var when = require('a').when;
var c = {};

when('./blob',c)
	.it('sets type').assertDoesNotThrow(c.blob.verify)
	.it('returns self').assertEqual(c.sut,c.returned);