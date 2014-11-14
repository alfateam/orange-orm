var when = require('a').when;
var c = {};

when(c)
	.it('should remove manyCache from domain').assertDoesNotThrow(c.setSessionSingleton.verify)
