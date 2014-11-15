var when = require('a').when;
var c = {};

when(c)
	.it('should fill cacheCore').assertDoesNotThrow(c.sut.tryAdd.verify)	
	.it('should return result from cacheCore').assertEqual(c.expected, c.returned)
	.it('should set cacheCore on setSessionSingleton').assertDoesNotThrow(c.setSessionSingleton.verify)
	.it('should synchronizeAdded').assertDoesNotThrow(c.synchronizeAdded.verify)
	.it('should synchronizeRemoved').assertDoesNotThrow(c.synchronizeRemoved.verify)	
	;
