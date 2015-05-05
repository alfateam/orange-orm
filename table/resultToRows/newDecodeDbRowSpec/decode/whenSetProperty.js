var when = require('a').when;
var c = {};

when(c)
	.it('should set property value').assertEqual(c.newValue1, c.dbRow.a)
	.it('should update field').assertDoesNotThrow(c.updateField.verify)	
	.it('should emit arbitary changed').assertDoesNotThrow(c.emitArbitaryChanged.verify)	