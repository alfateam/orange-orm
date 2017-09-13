var when = require('a').when;
var c = {};

when(c)
	.it('should push singleQuery to queries').assertDoesNotThrow(c.queries.push.verify)
	.it('returns queries').assertEqual(c.queries,c.returned)