var param1 = {};
var param2 = {};

function act(c) {
	c.param1 = param1;
	c.param2 = param2;

	c.collection = {};
	c.newCollection.expect(param1, param2).return(c.collection);
	c.returned = c.sut(c.text, param1, param2);
}

act.base = '../req';
module.exports = act;
