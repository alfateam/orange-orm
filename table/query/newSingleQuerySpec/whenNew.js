var when = require('a').when;
var c = {};

when(c)
    .it('should set queryContext').assertEqual(c.queryContext, c.sut.queryContext)
    .it('should set parameters to concated parameters').assertDeepEqual(c.parameters, c.sut.parameters);
