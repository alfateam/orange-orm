var when = require('a').when;
var c = {};

when(c)
	.it('should return promise').assertEqual(c.expected, c.returned)
	.it('should set dto.lines').assertDeepEqual([c.lineDto, c.lineDto2], c.dto.lines)
	;
