when = require('a').when;
var c = {};

when(c)
	.it('should remove row').assertDoesNotThrow(c.rows.remove.verify)