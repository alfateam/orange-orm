var when = require('a').when;
var c = {};

when('./execute',c).
	it('shold return value unchanged').assertEqual(c.value,c.returned);