var when = require('a').when;
var c = {};

when(c)
    .it('should set parameters to empty').assertDeepEqual([], c.sut.parameters);
