var when = require('a').when;
var c = {};

when(c)
.it('should visitOne').assertDoesNotThrow(c.visitor.visitOne.verify);