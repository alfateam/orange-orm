var when = require('a').when;
var c = {};

when('./get',c)
	.it('throws not found').assertEqual('Row not found.',c.thrownMsg);