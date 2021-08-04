var when = require('a').when;
var c = {};

when(c)
	.it('should invoke onCompleted').assertDoesNotThrow(c.onCompleted.verify)
