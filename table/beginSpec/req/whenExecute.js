var when = require('a').when;
var c = {};

when(c)
	.it('should set changeSet on session').assertDoesNotThrow(c.setSessionSingleton.verify)
	.it('should return executeQuery begin promise').assertEqual(c.expected, c.returned)
;