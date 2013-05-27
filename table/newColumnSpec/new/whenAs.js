var when = require('a_test').when;
var c = {};

when('./as',c).
	it('should set alias on sut').assertEqual(c.alias,c.sut.alias).
	it('should return self').assertStrictEqual(c.sut,c.returned);