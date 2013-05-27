var expected = {};

function act(c) {
	c.expected = expected;
	c.tryGetFirstFromDb.expect(c.table,c.filter,c.strategy).return(expected);
	c.get();
}
act.base = '../../new';
module.exports = act;