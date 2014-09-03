var when = require('a').when;
var c = {};

when(c)
	.it('should not get related rows').assertOk(c.didNotCrash)
;