var when = require('a').when;
var c = {};

when(c)
	.it('should not forward to remove').assertDoesNotThrow(c.sut.remove.verify);