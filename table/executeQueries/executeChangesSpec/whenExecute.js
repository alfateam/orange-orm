var when = require('a').when;
var c = {};

when(c)
	.it('should execute first query').assertEqual(c.expectedSecondResult, c.secondResult)
	.it('should execute second query merged as one').assertEqual(c.expected, c. returned)
;