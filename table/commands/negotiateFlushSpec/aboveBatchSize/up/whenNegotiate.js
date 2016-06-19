var when = require('a').when;
var c = {};

when(c)
	.it('should set prevQueryCount to queryCount').assertEqual(c.changeSet.queryCount, c.changeSet.prevQueryCount)
    .it('should flush').assertDoesNotThrow(c.flush.verify)
	.it('should double batch size').assertEqual(2, c.changeSet.batchSize)
