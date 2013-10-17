var when = require('a').when;
var c = {};

when(c).
	it('should visitMany').assertDoesNotThrow(c.visitor.visitMany.verify);
