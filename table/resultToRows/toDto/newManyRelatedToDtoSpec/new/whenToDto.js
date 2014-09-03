var when = require('a').when;
var c = {};

when(c)
	.it('should not fail').assertOk(c.didSuccess)
	.it('should set dto.lines').assertDeepEqual(c.dtos, c.dto.lines)