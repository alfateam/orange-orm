var when = require('a').when;
var c = {};

when('toArray',c)
	.it('returns array with correct length').assertEqual(5,c.returned.length)
	.it('contains element').assertEqual(c.element,c.returned[0])
	.it('contains element2').assertEqual(c.element2,c.returned[1])
	.it('contains element3').assertEqual(c.element3,c.returned[2])
	.it('contains element4').assertEqual(c.element4,c.returned[3])
	.it('contains element5').assertEqual(c.element5,c.returned[4]);