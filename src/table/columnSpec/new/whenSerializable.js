var when = require('a').when;
var c = {};

when(c).
	it('should set serializable on column').assertEqual(c.serializable,c.column.serializable).
	it('should return self').assertStrictEqual(c.sut,c.returned);