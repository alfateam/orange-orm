var when = require('a').when;
var c = {};

when(c)
	.it('should fill cacheCore').assertDoesNotThrow(c.sut.tryAdd.verify)	
	.it('should return result from cacheCore').assertEqual(c.expected, c.returned)
	.it('should set cacheCore on domain').assertEqual(c.cacheCore, c.domain[c.key])
	.it('should synchronizeAdded').assertDoesNotThrow(c.synchronizeAdded.verify)
	.it('should synchronizeRemoved').assertDoesNotThrow(c.synchronizeRemoved.verify)	
	;
