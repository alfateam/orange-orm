var when = require('a').when;
var c = {};

when(c)
	.it('should set commit on transaction').assertEqual(c.commit, c.sut.commit)
	.it('should set rollback on transaction').assertEqual(c.rollback, c.sut.rollback)