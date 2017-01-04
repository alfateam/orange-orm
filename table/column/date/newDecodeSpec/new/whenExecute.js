var when = require('a').when;
var c = {};

when(c).
	it('shold return clone').assertEqual(c.clonedValue, c.returned);