var when = require('a').when;
var c = {};

when(c)
	.it('should push command').assertDoesNotThrow(c.pushCommand.verify)
	;
