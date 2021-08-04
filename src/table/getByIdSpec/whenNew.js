var when = require('a').when;
var c = {};

when(c)
	.it('sets exclusive').assertEqual(c.getFromDbById.exclusive, c.sut.exclusive);
	