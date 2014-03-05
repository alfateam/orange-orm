var when = require('a').when;
var c = {};

when(c)
	.it('should call manyLegToQuery').assertDoesNotThrow(c.manyLegToQuery.verify);
