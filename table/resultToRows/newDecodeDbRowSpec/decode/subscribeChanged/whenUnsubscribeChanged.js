var when = require('a').when;
var c = {};

when(c)
	.it('should remove from emitAlias1Changed').assertDoesNotThrow(c.emitAlias1Changed.tryRemove.verify)