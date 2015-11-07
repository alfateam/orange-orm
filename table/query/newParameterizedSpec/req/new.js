var param1 = '1';
var param2 = '2';

function act(c) {
	c.param1 = param1;
	c.param2 = param2;
	c.optionalParams = {}
	c.params = [c.param1, c.param2];
	c.collection = {};
	c.extractSql.expect(c.initialText).return(c.text);
	c.extractParameters.expect(c.optionalParams).return(c.params);
	c.returned = c.sut(c.initialText, c.optionalParams);
}

module.exports = act;
