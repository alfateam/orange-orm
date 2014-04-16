var when = require('a').when;
var c = {};

when('./execute',c).
	it('shold return expected').assertEqual(c.expected,c.returned);