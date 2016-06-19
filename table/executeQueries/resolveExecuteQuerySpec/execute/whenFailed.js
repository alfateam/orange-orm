var when = require('a').when;
var c = {};

when(c)
	.it('should decrease queryCount').assertEqual(c.queryCount - 1, c.changeSet.queryCount)	
	.it('should invoke failed handler with error').assertDoesNotThrow(c.onFailed.verify);

