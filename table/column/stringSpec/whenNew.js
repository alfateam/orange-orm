var when = require('a').when;
var c  = {};

when('./new',c).
	it('should set encode').assertEqual(c.encode,c.sut.encode).
	it('should set decode').assertEqual(c.decode,c.sut.decode);