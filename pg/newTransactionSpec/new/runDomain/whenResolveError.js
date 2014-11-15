var when = require('a').when;
var c = {};

when(c)
	.it('should not set rdb').assertEqual(false, 'rdb' in c.domain)
    .it('should invoke onError callback').assertDoesNotThrow(c.onError.verify)
