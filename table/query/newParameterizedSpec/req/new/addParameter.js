var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

var nextPara = '3';

function act(c){
	var newParameterized = requireMock('../query/newParameterized');
	c.expected = {};
	newParameterized.expect(c.text, c.param1, c.param2, nextPara).return(c.expected);	
	c.returned = c.returned.addParameter(nextPara);
}

module.exports = act;