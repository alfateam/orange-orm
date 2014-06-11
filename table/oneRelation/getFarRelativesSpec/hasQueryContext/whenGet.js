var when = require('a').when;
var c = {};

when(c)
	.it('expands parent rows').assertDoesNotThrow(c.relation.expand.verify);