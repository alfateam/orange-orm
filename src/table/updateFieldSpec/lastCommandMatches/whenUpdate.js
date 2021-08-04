var when = require('a').when;
var c = {};

when(c)
	.it('should not push command').assertDoesNotThrow(c.pushCommand.verify)
	;
