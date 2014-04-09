var when = require('a').when;
var c = {};

when(c)
	.it('should return sql').assertEqual(c.sql, c.returned)
	.it('should set parameters').assertEqual(c.parameters, c.sut.parameters)	
	;
