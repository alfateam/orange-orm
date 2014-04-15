var when = require('a').when;
var c = {};

when(c)
	.it('should return empty promise').assertEqual(c.emptyPromise, c.returned)
;