var when = require('a').when;
var c = {};

when(c)
    .it('should set queryContext').assertDeepEqual(c.queryContext, c.sut.queryContext)
    .it('should set parameters to filter.parameters').assertEqual(c.parameters, c.sut.parameters);
