var when = require('a').when;
var c = {};

when(c)
	.it('should invoke executeQueriesCore').assertEqual(c.executeQueriesCoreResult, c.queryResult)
	.it('should return expected promise').assertEqual(c.expected,c.returned)

