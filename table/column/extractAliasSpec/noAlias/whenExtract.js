var when = require('a').when;
var c = {};

when(c)
	.it('should return default alias').assertEqual('_0',c.returned);