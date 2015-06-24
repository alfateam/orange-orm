var arg = {};

function act(c){
	c.expected = {};
	c.iStartsWith.expect(c.column,arg,c.alias).return(c.expected);
	c.returned = c.column.iStartsWith(arg,c.optionalAlias);
}

module.exports = act;