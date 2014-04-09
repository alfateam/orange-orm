var when = require('a').when;
var c = {};

when(c)
	.it('should add to emitAlias1Changed').assertDoesNotThrow(c.emitAlias1Changed.add.verify)
	;
