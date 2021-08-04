var when = require('a').when;
var c = {};

when(c)
	.it('should return command').assertEqual(c.command, c.sut)
	.it('should set endEdit to empty func').assertDoesNotThrow(c.sut.endEdit)
	.it('should set matches to empty func').assertDoesNotThrow(c.sut.matches)
	
	;
