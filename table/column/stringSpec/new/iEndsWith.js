var arg = {};

function act(c){
	c.expected = {};
	c.iEndsWith.expect(c.column,arg,c.alias).return(c.expected);
	c.returned = c.column.iEndsWith(arg,c.optionalAlias);
}

module.exports = act;