var when = require('a').when;
var c = {};

when(c)
	.it('should return correct sql').assertEqual(c.expected, c.returnedSql)
	.it('should return correct parameter').assertEqual(c.expectedParam, c.returnedParameters[0])
	.it('should have one parameter').assertEqual(1, c.returnedParameters.length)
	;
