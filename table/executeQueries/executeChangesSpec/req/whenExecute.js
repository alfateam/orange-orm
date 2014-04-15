var when = require('a').when;
var c = {};

when(c)
	.it('should return result as promise').assertEqual(c.expected, c.returned)
	.it('should execute second query').assertEqual(c.q2Promise, c.q2Result)
;