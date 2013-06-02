var when = require('a_test').when;
var c = {};

when('./new',c)
	.it('should negotiate default').assertDoesNotThrow(c.negotiateDefault.verify)
	.it('should negotiate DbNull').assertDoesNotThrow(c.negotiateDbNull.verify)
	.it('should set column.purify').assertEqual(c.purify,c.column.purify)
	.it('should set column.encode').assertEqual(c.encode,c.column.encode)
	.it('should set column.decode').assertEqual(c.decode,c.column.decode);