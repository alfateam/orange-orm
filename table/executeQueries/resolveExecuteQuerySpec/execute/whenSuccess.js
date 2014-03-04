var when = require('a').when;
var c = {};

when(c).
	it('should invoke success handler with result').assertDoesNotThrow(c.onSuccess.verify);
