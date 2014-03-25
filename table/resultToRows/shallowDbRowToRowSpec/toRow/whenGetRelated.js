var when = require('a').when;
var c = {};

when(c)
	.it('should set customer').assertEqual(c.customer, c.sut.customer)
	.it('should set lines').assertEqual(c.lines, c.sut.lines)
	;
