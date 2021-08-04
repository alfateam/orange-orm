var when = require('a').when;

var c = {};
when('./exec', c)
	.it('should not change column.default').assertDeepEqual(c.expectedDefault, c.column.default);
