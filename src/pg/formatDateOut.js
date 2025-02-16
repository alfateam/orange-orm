
function formatDateOut(column, alias) {
	return `${alias}."${(column._dbName)}"::text`;
}

module.exports = formatDateOut;