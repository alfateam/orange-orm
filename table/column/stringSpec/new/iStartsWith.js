var arg = {},
	alias = {};

function act(c){
	c.expected = {};
	c.iStartsWith.expect(c.column,arg,alias).return(c.expected);
	c.returned = c.column.iStartsWith(arg,alias);
}

module.exports = act;