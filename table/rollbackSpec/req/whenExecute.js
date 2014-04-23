var when = require('a').when;
var c = {};

when(c)
	.it('should pop changes').assertDoesNotThrow(c.popChanges.verify)
	.it('should return rollbackPromise').assertEqual(c.expected, c.returned)
;