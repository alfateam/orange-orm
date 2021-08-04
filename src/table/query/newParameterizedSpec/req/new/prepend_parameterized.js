var requireMock = require('a').requireMock;
var mock = require('a').mock;
var newParameterized = requireMock('../query/newParameterized');
var parameterizedToPrepend = {};
var param3 = {};
var param4 = {};

function act(c) {
	c.expected = {};
	parameterizedToPrepend.sql = mock();
	parameterizedToPrepend.sql.expect().return('textToPrepend');	
	parameterizedToPrepend.parameters = [param3, param4];
	newParameterized.expect('textToPrepend' + c.text, [param3, param4, c.param1, c.param2]).return(c.expected);
	c.returned = c.returned.prepend(parameterizedToPrepend);
}

act.base = '../new';
module.exports = act;