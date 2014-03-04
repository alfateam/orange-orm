var when = require('a').when;
var c = {};

when(c).
	it('should run query against client').assertDoesNotThrow(c.dbClient.query.verify)
	;
