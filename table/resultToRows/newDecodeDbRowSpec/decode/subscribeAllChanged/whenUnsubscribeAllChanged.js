var when = require('a').when;
var c = {};

when(c)
	.it('should remove from emitArbitaryChanged').assertDoesNotThrow(c.emitArbitaryChanged.tryRemove.verify)