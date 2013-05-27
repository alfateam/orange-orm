var dbNull = {};
var base64 = '<base64String>';
var value = {};

function act(c) {	
	c.expected = 'decode(\'<base64String>\',\'base64\')';
	c.stringToBase64.expect(value).return(base64);
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(value);
}

act.base = '../new';
module.exports = act;