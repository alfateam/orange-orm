var when = require('a').when;
var c = {};

when(c)
	.it('should end edit last Command').assertDoesNotThrow(c.lastCommand.endEdit.verify)
	.it('should return compressed changeSet').assertEqual(c.expected, c.returned)
	.it('should set clear changeSet').assertDeepEqual(0, c.changeSet.length)
	;
