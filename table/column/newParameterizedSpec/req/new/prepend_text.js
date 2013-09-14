var requireMock = require('a').requireMock;
var newParameterized = requireMock('./newParameterized');

function act(c) {
	c.expected = {};
	c.textToPrepend = 'textToPrepend';
	newParameterized.expect(c.textToPrepend + c.text, c.param1, c.param2).return(c.expected);
	c.returned = c.returned.prepend(c.textToPrepend);
}

act.base = '../new';
module.exports = act;