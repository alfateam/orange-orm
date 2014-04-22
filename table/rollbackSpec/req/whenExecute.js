var when = require('a').when;
var c = {};

when(c)
	.it('should return rollbackPromise').assertEqual(c.expected, c.returned)
;