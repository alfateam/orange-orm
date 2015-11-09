var when = require('a').when;
var c = {};

when(c)
	.it('should call joinLegToQuery').assertDoesNotThrow(c.joinLegToQuery.verify)
	.it('should call oneLegToQuery').assertDoesNotThrow(c.oneLegToQuery.verify)
	.it('should call manyLegToQuery').assertDoesNotThrow(c.manyLegToQuery.verify)
