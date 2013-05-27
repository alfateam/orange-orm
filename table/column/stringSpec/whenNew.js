var when = require('a_test').when;
var c  = {};

when('./new',c).
	it('should set encode').assertEqual(c.encode,c.sut.encode).
	it('should set decode').assertEqual(c.decode,c.sut.decode);