var when = require('a').when;
var c = {};

when(c)
.it('should set parameters to filter.parameters').assertEqual(c.parameters,c.sut.parameters);
