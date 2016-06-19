var when = require('a').when;
var c = {};

when(c)
    .it('should flush').assertDoesNotThrow(c.flush.verify)
	.it('should not change batch size').assertEqual(1, c.changeSet.batchSize)
