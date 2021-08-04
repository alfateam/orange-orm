var when = require('a').when;
var c = {};

when(c).
	it('should set equal').assertOk(c.sut.equal).
	it('should set between').assertOk(c.sut.between).
	it('should not set property foo').assertEqual(false, 'foo' in c.sut).
	it('should not set property bar').assertEqual(false, 'bar' in c.sut);

