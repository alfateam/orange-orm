var when = require('a').when;
var c = {};

when(c)
	.it('returns row').assertEqual(c.row, c.returned)
	.it('returns promise').assertEqual(c.expected,c.returnedPromise);