var when = require('a').when;
var c = {};

when(c)
	.it('should encode true').assertEqual('1', c.sut(true))
	.it('should encode false').assertEqual('0', c.sut(false))
