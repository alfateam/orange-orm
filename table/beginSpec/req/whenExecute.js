var when = require('a').when;
var c = {};

when(c)
	.it('should reset changeSet').assertDoesNotThrow(c.resetChangeSet.verify)
	.it('should return executeQuery begin promise').assertEqual(c.expected, c.returned)
;