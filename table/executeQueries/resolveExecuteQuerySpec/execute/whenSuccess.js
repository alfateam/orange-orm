var when = require('a').when;
var c = {};

when(c)
	.it('should decrease queryCount').assertEqual(c.queryCount - 1, c.changeSet.queryCount)	
    .it('should attach queryContext to rows').assertEqual(c.queryContext, c.rows.queryContext)
    .it('should hide queryContext on rows').assertEqual(-1, Object.keys(c.rows).indexOf('queryContext'))
    .it('should invoke success handler with result').assertDoesNotThrow(c.onSuccess.verify)
