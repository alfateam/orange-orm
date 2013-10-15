var when = require('a').when;
var c = {};

when('./execute',c).
	it('should add manyLegQuery to compositeQuery ').assertDoesNotThrow(c.compositeQuery.add.verify).
	it('returns compositeQuery').assertEqual(c.compositeQuery,c.returned);