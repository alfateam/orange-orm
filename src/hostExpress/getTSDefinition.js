let _getTSDefinition = require('../getTSDefinition');

function getTSDefinition(table, customFilters = {}, request) {
	let url = request.originalUrl[request.originalUrl.length - 1] === '/' ? request.originalUrl[request.originalUrl.length - 1].slice(0, -2) : request.originalUrl;
	let Name = url.split('/').pop()[0].toUpperCase() + url.split('/').pop().slice(1);
	let name = Name[0].toLowerCase() + Name.substr(1);
	return _getTSDefinition(table, {customFilters, name});
}


module.exports = getTSDefinition;