var when = require('a').when;
var c = {};

when(c)
    .it('should get far relatives').assertDoesNotThrow(c.getRelatives.verify)
    .it('should expand rows').assertDoesNotThrow(c.expandRows.verify)
