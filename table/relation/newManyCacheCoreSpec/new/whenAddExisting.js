var when = require('a').when;
var c = {};

when(c)
	.it('should push to existing').assertDoesNotThrow(c.existing.push.verify)
	;
