var when = require('a').when;
var c = {};

when(c)
	.it('should throw after running rollback').assertEqual(c.expected, c.returned)