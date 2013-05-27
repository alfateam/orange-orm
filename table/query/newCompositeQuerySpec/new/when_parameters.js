var when = require('a_test').when;
var c = {};

when('./parameters',c)
	.it('returns compositeParameters').assertEqual(c.compositeParameters,c.returned);
