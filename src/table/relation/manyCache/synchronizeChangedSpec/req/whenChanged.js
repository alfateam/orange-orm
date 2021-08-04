var when = require('a').when;
var c = {};

when(c)
	.it('should unsubscribe changed').assertDoesNotThrow(c.child.unsubscribeChanged.verify)
	.it('should remove child from old parent').assertDoesNotThrow(c.manyCache.tryRemove.verify)
	.it('should add child to new parent').assertDoesNotThrow(c.manyCache.tryAdd.verify)
	;
