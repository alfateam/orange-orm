var when = require('a').when;
var c = {};

when(c)
.it('should forward properties of old domain').assertDoesNotThrow(c.negotiateForwardProperty.verify)
.it('should return new domain').assertEqual(c.newDomain, c.returned)
