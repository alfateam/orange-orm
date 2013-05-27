var query = {};
var parameters = {};

function act(c) {
	var addRange = c.mock();
	addRange.expect(parameters).return();
	c.collection.addRange = addRange;
	query.parameters = c.mock();
	query.parameters.expect().return(parameters);
	c.query = query;
	c.sut.add(query);
}

act.base = '../new';
module.exports = act;