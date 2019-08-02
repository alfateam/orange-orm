
module.exports = function(column) {
	if(!column.hasOwnProperty.call(column,'default'))
		column.default = 0;
};