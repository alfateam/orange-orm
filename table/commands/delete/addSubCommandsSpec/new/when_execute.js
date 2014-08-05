var when = require('a').when;
var c = {};

when(c)
	.it('should call legToQuery').assertDoesNotThrow(c.legToQuery.verify)
