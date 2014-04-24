var when = require('a').when;
var c = {};

when(c)
	.it('should return commit and rollback').assertDoesNotThrow(c.success.verify)
	;
