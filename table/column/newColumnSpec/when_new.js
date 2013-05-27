var when = require('a_test').when;
var c = {};

when('./new',c)
	.it('should set columnName').assertEqual(c.name,c.sut.columnName)
	.it('should set name').assertEqual(c.name,c.sut.name);