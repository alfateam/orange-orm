var when = require('a').when;
var c = {};

when(c)
	.it('should return array').assertDeepEqual(true, c.sut instanceof Array)
	.it('should return empty array').assertEqual(0, c.sut.length)
	.it('toJSON should not be enumerable').assertEqual(false, c.sut.propertyIsEnumerable('toJSON'))
	;
