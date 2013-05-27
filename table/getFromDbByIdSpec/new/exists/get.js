var expected = {};

function act(c) {
	c.expected = expected;
	c.tryGetFromDbById.expect(c.table,c.id,c.strategy).return(expected);
	c.get();
}
act.base = '../../new';
module.exports = act;