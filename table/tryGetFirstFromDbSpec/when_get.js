var when = require('a').when;
var c  = {};

when(c)
	.it('returns rowsPromise').assertEqual(c.expected,c.returned);