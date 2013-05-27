var when = require('a_test').when;
var c = {};

when('./get',c)
	.it('throws not found').assertEqual('Row not found.',c.thrownMsg);