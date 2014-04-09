
var when = require('a').when;
var c = {};

when(c)
	.it('should return result as promise').assertEqual(c.resultPromise, c.returned)
	;
