var requireMock = require('a_mock').requireMock;
var mock = require('a_mock').mock;
var newParameterized = requireMock('./newParameterized');
var parameterizedToPrepend = {};
var parameters = {};
var param3 = {};
var param4 = {};
var parameterArray = [param3,param4];

function act(c) {
	c.expected = {};
	parameterizedToPrepend.sql = mock();
	parameterizedToPrepend.sql.expect().return('textToPrepend');	
	parameterizedToPrepend.parameters = parameters;
	parameters.toArray = mock();
	parameters.toArray.expect().return(parameterArray);
	newParameterized.expect('textToPrepend' + c.text, param3, param4, c.param1, c.param2).return(c.expected);
	c.returned = c.returned.prepend(parameterizedToPrepend);
}

act.base = '../new';
module.exports = act;