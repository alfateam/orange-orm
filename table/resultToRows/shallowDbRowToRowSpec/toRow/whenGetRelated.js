var when = require('a').when;
var c = {};

when(c)
	.it('should return customer').assertEqual(c.customer, c.returnedCustomer)
	.it('should return lines').assertEqual(c.lines, c.returnedLines)
	;
