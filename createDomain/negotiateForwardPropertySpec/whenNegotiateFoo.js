var when = require('a').when;
var c = {};

when(c)
    .it('should forward property getter through new domain').assertEqual(c.oldFoo, c.originalValue)
    .it('should update value on old domain when setting on new domain').assertEqual(c.newFoo, c.oldDomain.foo)
