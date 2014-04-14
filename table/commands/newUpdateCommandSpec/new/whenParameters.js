var when = require('a').when;
var c = {};

when(c)
	.it('should return parameters').assertEqual(c.parameters, c.returned)
	;