var when = require('a').when;
var c = {};

when(c)
	.it('expands parent rows').assertDoesNotThrow(c.relation.expand.verify)
	.it('returns true').assertStrictEqual(true, c.returned)	