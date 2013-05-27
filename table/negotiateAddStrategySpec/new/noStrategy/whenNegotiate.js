var when = require('a_test').when;
var c = {};


when('./negotiate',c)
	.it('returns array with one extra element').assertEqual(4, c.returned.length)
	.it('returns array with table').assertEqual(c.table,c.returned[0])
	.it('returns array with id1').assertEqual(c.id1,c.returned[1])
	.it('returns array with id2').assertEqual(c.id2,c.returned[2])
	.it('returns array with emptyStrategy').assertEqual(c.emptyStrategy,c.returned[3])