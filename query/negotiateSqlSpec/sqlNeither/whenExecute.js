var when = require('a').when;
var c = {};

when(c)
.it('should throw error with "Query lacks sql property string or function"').assertEqual('Query lacks sql property string or function', c.thrownMessage)
