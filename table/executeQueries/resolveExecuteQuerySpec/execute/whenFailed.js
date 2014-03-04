var when = require('a').when;
var c = {};

when(c).
	it('should invoke failed handler with error').assertDoesNotThrow(c.onFailed.verify);
