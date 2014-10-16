var when = require('a').when;
var c = {};

when(c)
	.it('should return releasePromise without throwing').assertEqual(c.expected, c.returned)
;