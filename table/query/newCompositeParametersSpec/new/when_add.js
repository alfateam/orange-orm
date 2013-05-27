var when = require('a_test').when;
var c = {};

when('./add',c)
	.it('should forward to collection.addRange').assertDoesNotThrow(c.collection.addRange.verify);