var when = require('a').when;
var c = {};

when(c)
	.it('should return dtos').assertDeepEqual([c.dto, c.dto2], c.returned)
	;
