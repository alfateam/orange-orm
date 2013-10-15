var requireMock = require('a').requireMock;
var newParameterized = requireMock('../query/newParameterized');

function act(c) {
	c.expected = {};
	c.textToAppend = 'textToAppend';
	newParameterized.expect(c.text + c.textToAppend, c.param1, c.param2).return(c.expected);
	c.returned = c.returned.append(c.textToAppend);
}

act.base = '../new';
module.exports = act;