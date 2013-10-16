var when = require('a').when;
var c = {};

when(c).
	it('should set table').assertEqual(c.table,c.returned.table).
	it('should set legs to empty collection').assertEqual(c.legs,c.returned.legs);
