var when = require('a').when;
var c = {};

when(c)
	.it('should add to emitAlias1Changed').assertDoesNotThrow(c.emitAlias1Changed.add.verify)
	.it('should add to emitAlias2Changed').assertDoesNotThrow(c.emitAlias2Changed.add.verify)
	;
