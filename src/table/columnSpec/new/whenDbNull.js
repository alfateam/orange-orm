var when = require('a').when;
var c = {};

when('./dbNull',c).
	it('should set dbNull on column').assertEqual(c.dbNull,c.column.dbNull).
	it('should return self').assertStrictEqual(c.sut,c.returned);