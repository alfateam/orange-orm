var when = require('a_test').when;
var c = {};

when('./execute',c)
	.it('should add manyLegQuery to compositeQuery ').assertDoesNotThrow(c.compositeQuery.add.verify);