var when = require('a').when;
var c = {};

when(c)
	.it('should push to existing').assertDoesNotThrow(c.existing.push.verify)
	.it('should synchronize changed').assertDoesNotThrow(c.synchronizeChanged.verify)
	;
