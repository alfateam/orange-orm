
function act(c) {
	c.tryGetFromDbById.expect(c.table,c.id,c.strategy).return(null);
	c.get();
}
act.base = '../../new';
module.exports = act;