var when = require('a').when;
var c = {};

when(c)
	.it('should end edit last command').assertDoesNotThrow(c.lastCommand.endEdit.verify)
	