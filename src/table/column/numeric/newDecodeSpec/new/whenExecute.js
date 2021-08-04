var when = require('a').when;
var c = {};

when(c).
	it('shold return value unchanged').assertEqual(c.value,c.returned);