
function formatDateOut(column, alias) {
	if (alias)
		return `${alias}."${(column._dbName)}"::text`;
	else
		return `"${(column._dbName)}"::text`;
}

module.exports = formatDateOut;