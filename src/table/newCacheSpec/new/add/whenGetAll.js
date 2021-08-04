var when = require('a').when;
var c = {};

when(c)
	.it('should return cached result').assertDeepEqual([c.result], c.returned)
	;
