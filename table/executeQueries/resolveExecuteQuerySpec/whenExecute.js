var when = require('a').when;
var c = {};

when(c)
	.it('should log query').assertDoesNotThrow(c.log.verify)
	.it('should run query against client').assertDoesNotThrow(c.dbClient.executeQuery.verify)