var when = require('a').when;
var c = {};

when(c)
	.it('should add row').assertDoesNotThrow(c.rows.add.verify)
