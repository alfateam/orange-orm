var when = require('a').when;
var c = {};

when(c)
	.it('should set parameters').assertEqual(c.parameters, c.sut.parameters)
	