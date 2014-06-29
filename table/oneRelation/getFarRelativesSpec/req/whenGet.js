var when = require('a').when;
var c = {};

when(c)
	.it('returns rows').assertEqual(c.rows, c.returned)
;