var when = require('a').when;
var c = {};

when(c)
	.it('should encode true').assertEqual('true', c.sut(true))
	.it('should encode false').assertEqual('false', c.sut(false))
