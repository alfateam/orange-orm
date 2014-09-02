var when = require('a').when;
var c = {};

when(c).
	it('should create new query').assertDoesNotThrow(c.newQuery.verify)
	.it('should return query').assertEqual(c.query, c.returned)
	
