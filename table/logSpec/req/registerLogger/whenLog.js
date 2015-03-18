var when = require('a').when;
var c = {};

when(c)
	.it('should forward to logger').assertDoesNotThrow(c.logger.verify)
