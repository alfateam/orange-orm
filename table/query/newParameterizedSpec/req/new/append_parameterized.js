var requireMock = require('a').requireMock;
var mock = require('a').mock;
var newParameterized = requireMock('../query/newParameterized');
var parameterizedToAppend = {};
var parameters = {};
var param3 = {};
var param4 = {};
var parameterArray = [param3,param4];
var textToAppend = 'textToAppend';

function act(c) {	
	c.expected = {};
	parameterizedToAppend.sql = mock();
	parameterizedToAppend.sql.expect().return(textToAppend);	

	parameterizedToAppend.parameters = parameters
	parameters.toArray = mock();
	parameters.toArray.expect().return(parameterArray);
	newParameterized.expect(c.text + textToAppend , c.param1, c.param2, param3, param4).return(c.expected);
	c.returned = c.returned.append(parameterizedToAppend);
}

act.base = '../new';
module.exports = act;