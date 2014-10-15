var when = require('a').when;
var c = {};

when(c).
	it('should return shallowFilter unchanged').assertEqual(c.shallowFilter,c.returned);
