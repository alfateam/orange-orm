var when = require('a').when;
var c = {};

when('./parameters',c)
	.it('returns compositeParameters').assertEqual(c.compositeParameters,c.returned);
