var when = require('a').when;
var c = {};

when(c)
	.it('should have value1').assertEqual(c.value1, c.sut.alias1)
	.it('should have value2').assertEqual(c.value2, c.sut.alias2)
	.it('should should set offset on dbRow').assertEqual(2, c.dbRowTemplate.offset)