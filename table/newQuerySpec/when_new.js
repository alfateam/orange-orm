var when = require('a').when;
var c = {};

when('./new',c).
	it('should push singleQuery to queries').assertDoesNotThrow(c.queries.push.verify).
	it('should addSubQueries').assertDoesNotThrow(c.addSubQueries.verify).
	it('returns queries').assertEqual(c.queries,c.returned);