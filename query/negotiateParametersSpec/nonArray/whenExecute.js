var when = require('a').when;
var c = {};

when(c)
.it('should throw error with "Query has invalid parameters property. Must be undefined or array"').assertEqual("Query has invalid parameters property. Must be undefined or array", c.thrownMessage)
