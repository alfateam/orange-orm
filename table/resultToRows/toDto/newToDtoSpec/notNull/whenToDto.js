var when = require('a').when;
var c = {};

when(c)
	.it('should map fields').assertDoesNotThrow(c.mapFields.verify)
	.it('should return dto').assertEqual(c.dto, c.returned)