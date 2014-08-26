var when = require('a').when;
var c = {};

when(c)
    .it('should attach queryContext to result').assertEqual(c.queryContext, c.result.queryContext)
    .it('should invoke success handler with result').assertDoesNotThrow(c.onSuccess.verify)
