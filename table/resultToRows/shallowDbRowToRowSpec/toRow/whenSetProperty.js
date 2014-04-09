var when = require('a').when;
var c = {};

when(c)
	.it('should set property value').assertEqual(c.newValue1, c.sut.alias1)
	.it('should emit alias1 changed').assertDoesNotThrow(c.emitAlias1Changed.verify)
	
	;
