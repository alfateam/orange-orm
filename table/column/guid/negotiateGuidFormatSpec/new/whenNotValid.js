var when = require('a').when;
var c = {};

when(c)
	.it('should throw with error message').assertEqual(c.expectedMessage, c.thrownMessage);