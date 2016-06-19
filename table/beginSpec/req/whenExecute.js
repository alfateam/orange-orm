var when = require('a').when;
var c = {};

when(c)
	.it('should set changeSet on session').assertDoesNotThrow(c.setSessionSingleton.verify)
	.it('should set prevQueryCount to negative').assertEqual(-1, c.changeSet.prevQueryCount)
	.it('should set queryCount to zero').assertEqual(0, c.changeSet.queryCount)
	.it('should set batchSize to one').assertEqual(1, c.changeSet.batchSize)
	.it('should return executeQuery begin promise').assertEqual(c.expected, c.returned)