var when = require('a').when;
var c = {};

when(c)
	.it('should push commitCommand').assertDoesNotThrow(c.pushCommand.verify)
	.it('should execute changes').assertEqual(c.expected, c.returned)
;