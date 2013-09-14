var mock = require('a').mock;
var query = {};

function act(c) {
	c.compositeSql.add = mock();
	c.compositeSql.add.expect(query).return();
	c.compositeParameters.add = mock();
	c.compositeParameters.add.expect(query).return();
	c.query = query;
	c.returned = c.sut.add(query);
}
act.base = '../new'
module.exports  = act;