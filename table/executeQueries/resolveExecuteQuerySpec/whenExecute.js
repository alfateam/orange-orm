var when = require('a').when;
var c = {};

when(c)
	.it('should increase queryCount').assertEqual(c.queryCount + 1, c.changeSet.queryCount)	
	.it('should run query against client').assertDoesNotThrow(c.dbClient.executeQuery.verify)

