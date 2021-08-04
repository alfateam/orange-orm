var when = require('a').when;
var c = {};

when(c).
	it('should visit one').assertDoesNotThrow(c.visitor.visitOne.verify);
