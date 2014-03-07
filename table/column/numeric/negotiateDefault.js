
module.exports = function(column) {
	if(!column.hasOwnProperty('default'))
		column.default = 0;
};