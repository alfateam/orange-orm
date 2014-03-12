var when = require('a').when;
var c = {};

when(c)
	.it('should set sql to filter.sql').assertEqual(c.filter.sql, c.sut.sql)
	.it('should set parameters to filter.parameters').assertEqual(c.filter.parameters, c.sut.parameters)
	;
