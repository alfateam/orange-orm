var when = require('a').when;
var c = {};

when(c)
.it('should expand customer').assertEqual(true, c.getCustomer.expanded)
.it('should expand lines').assertEqual(true, c.getLines.expanded)

