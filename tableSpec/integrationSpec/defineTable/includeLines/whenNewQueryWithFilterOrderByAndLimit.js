var when = require('a').when;
var c = {};
when(c)
	.it('should return correct sql for query1').assertEqual(c.expected,c.returned[0].sql())
