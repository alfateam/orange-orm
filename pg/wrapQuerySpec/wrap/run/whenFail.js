var when = require('a').when;
var c = {};

when(c)
	.it('should invoke onCompleted with error').assertDoesNotThrow(c.onCompleted.verify)
