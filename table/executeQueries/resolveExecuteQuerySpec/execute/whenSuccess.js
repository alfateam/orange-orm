var when = require('a').when;
var c = {};

when(c)
    .it('should attach queryContext to rows').assertEqual(c.queryContext, c.rows.queryContext)
    .it('should invoke success handler with result').assertDoesNotThrow(c.onSuccess.verify)
