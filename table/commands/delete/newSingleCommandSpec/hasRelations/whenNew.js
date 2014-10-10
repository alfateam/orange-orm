var when = require('a').when;
var c = {};

when(c)
	.it('should set parameters to filter.parameters').assertEqual(c.parameters,c.sut.parameters)
	.it('sql returns expected').assertEqual(c.sql,c.sut.sql())