
function act(c) {
	c.returned = c.sut(c.table,c.id1,c.id2);
}
act.base = '../../new';
module.exports = act;