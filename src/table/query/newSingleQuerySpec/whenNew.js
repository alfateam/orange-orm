var when = require('a').when;
var c = {};

when(c)
    .it('should set parameters to concated parameters').assertDeepEqual(c.parameters, c.sut.parameters);
