var when = require('a').when;
var c = {};

when(c)
	.it('should return default db name').assertEqual(c.table._dbName,c.returned);