var param1 = {};
var param2 = {};

function act(c) {
	c.param1 = param1;
	c.param2 = param2;
	c.collection = {};
	c.newCollection.expect(param1, param2).return(c.collection);
	c.extractSql.expect(c.initialText).return(c.text);
	c.returned = c.sut(c.initialText, param1, param2);
}

act.base = '../req';
module.exports = act;
