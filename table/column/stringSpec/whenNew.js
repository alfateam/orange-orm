var when = require('a').when;
var c  = {};

when('./new',c)
	.it('should set purify').assertEqual(c.purify, c.column.purify)
	.it('should set encode on column').assertEqual(c.encode,c.column.encode)
	.it('should set decode on column').assertEqual(c.decode,c.column.decode)
	;