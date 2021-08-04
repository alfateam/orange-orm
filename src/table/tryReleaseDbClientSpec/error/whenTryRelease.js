var when = require('a').when;
var c = {};

when(c)
	.it('should forward to releaseDbClient').assertDoesNotThrow(c.releaseDbClient.verify)
