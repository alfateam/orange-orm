var when = require('a').when;
var c = {};

when(c)
	.it('should not attach dbClient to domain').assertEqual(false, 'dbClient' in c.domain)

    .it('should invoke onError callback').assertDoesNotThrow(c.onError.verify)
    ;
