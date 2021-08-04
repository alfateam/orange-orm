var when = require('a').when;
var c = {};

when(c).
	it('should return correct sql').assertEqual(c.expected, c.returned[0].sql())
	;
