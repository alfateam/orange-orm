var when = require('a').when;
var c = {};

when(c)
	.it('endEdit points at sut.sql').assertEqual(c.sut.sql, c.sut.endEdit)
	.it('should set parameters').assertEqual(c.parameters, c.sut.parameters)
	.it('should set sql').assertEqual(c.sql, c.sut.sql())	
	.it('matches returns false').assertEqual(false, c.sut.matches('whatEver'))	
	;
