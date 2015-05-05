var when = require('a').when;
var c = {};

when(c)
	.it('should add to emitArbitaryChanged').assertDoesNotThrow(c.emitArbitaryChanged.add.verify)