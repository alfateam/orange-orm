
function act(c) {
	c.tryGetFirstFromDb.expect(c.table,c.filter,c.strategy).return(null);
	c.get();
}
act.base = '../../new';
module.exports = act;