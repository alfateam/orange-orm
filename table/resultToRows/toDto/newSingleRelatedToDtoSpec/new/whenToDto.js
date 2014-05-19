var when = require('a').when;
var c = {};

when(c)
	.it('should return promise').assertEqual(c.expected, c.returned)
	.it('should set dto.customer').assertEqual(c.customerDto, c.dto.customer)
	;
