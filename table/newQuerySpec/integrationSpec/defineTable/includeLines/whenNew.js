var when = require('a').when;
var c = {};
when(c)
	.it('should return correct sql for query1').assertEqual(c.expected,c.returned[0].sql())
	.it('should return correct sql for query2').assertEqual(c.expected2,c.returned[1].sql())
	;