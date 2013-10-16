var when = require('a').when;
var c = {};

when(c).
	it('should visit join').assertDoesNotThrow(c.visitor.visitJoin.verify);
