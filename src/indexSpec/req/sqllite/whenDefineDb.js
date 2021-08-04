var when = require('a').when;
var c = {};

when(c)
	.it('should return database').assertEqual(c.database, c.returned)