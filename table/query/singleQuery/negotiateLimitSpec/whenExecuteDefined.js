var when = require('a').when;
var c = {};

when(c)
.it('should return input with space added in front').assertEqual(c.expected, c.returned1)
.it('should return input').assertEqual(c.expected, c.returned2)
.it('should return empty string if input is empty string').assertEqual(c.expected3, c.returned3);