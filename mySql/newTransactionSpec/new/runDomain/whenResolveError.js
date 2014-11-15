var when = require('a').when;
var c = {};

when(c)
	.it('should not attach rdb to domain').assertEqual(false, 'rdb' in c.domain)
    .it('should invoke onError callback').assertDoesNotThrow(c.onError.verify)
