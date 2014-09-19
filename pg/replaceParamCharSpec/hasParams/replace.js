function act(c) {
	c.initialSql = 'SELECT ID FROM ORDER WHERE ID=? AND NAME LIKE ? AND ADDRESS LIKE ? bla bla';
	c.sql = 'SELECT ID FROM ORDER WHERE ID=$1 AND NAME LIKE $2 AND ADDRESS LIKE $3 bla bla';

    c.query.sql.expect().return(c.initialSql);

	c.returned = c.sut(c.query, ['a','b','c']);
}

module.exports = act;