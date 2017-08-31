var when = require('a').when;
var c = {};

when(c)
	.it('should push singleQuery to queries').assertDoesNotThrow(c.queries.push.verify)
	.it('should set limitQuery on queryContext').assertEqual(c.limitQuery, c.singleQuery.queryContext.limitQuery)	
	.it('returns queries').assertEqual(c.queries,c.returned)