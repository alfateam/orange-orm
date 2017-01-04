var when = require('a').when;
var c = {};

when(c)
    .it('should not forward existing').assertEqual(c.newDomain.foo, c.existingFoo)