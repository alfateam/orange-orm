var when = require('a').when;
var c = {};

when(c)
	.it('should pop changes').assertDoesNotThrow(c.popChanges.verify)
	.it('should return releasePromise').assertEqual(c.expected, c.returned)
;