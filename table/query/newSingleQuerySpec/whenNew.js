var when = require('a').when;
var c = {};

when(c)
    .it('should set queryContext').assertEqual(c.queryContext, c.sut.queryContext)
    .it('should set parameters to filter.parameters').assertEqual(c.parameters, c.sut.parameters);
