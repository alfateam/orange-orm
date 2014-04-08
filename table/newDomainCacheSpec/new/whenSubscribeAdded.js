var when = require('a').when;
var c = {};

when(c)
	.it('should subscribe to added').assertDoesNotThrow(c.cache.subscribeAdded.verify)	
	;
