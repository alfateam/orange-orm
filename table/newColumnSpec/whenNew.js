var when = require('a_test').when;
var c = {};

when('./new',c)
	.it('should set name').assertEqual(c.columnName,c.sut.name);