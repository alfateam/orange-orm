var when = require('a').when;

var c = {};
when('./exec', c)
	.it('should set column.default to zero').assertDeepEqual(0, c.column.default);
