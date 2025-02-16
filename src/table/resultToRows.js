var dbRowsToRows = require('./resultToRows/dbRowsToRows');

async function resultToRows(context, span, result) {
	let rows = await result[0].then(onResult);
	await expand(spanToStrategy(span), rows);
	return rows;

	function onResult(result) {
		return dbRowsToRows(context, span, result);
	}
}

async function expand(strategy, rows) {
	if (!rows)
		return;
	if (!Array.isArray(rows))
		rows = [rows];
	for (let p in strategy) {
		if (!(strategy[p] === null || strategy[p]))
			continue;
		for (let i = 0; i < rows.length; i++) {
			await expand(strategy[p], await rows[i][p]);
		}
	}
}

function spanToStrategy(span) {
	let strategy = {};

	span.legs.forEach((leg) => {
		strategy[leg.name] = spanToStrategy(leg.span);
	});
	return strategy;

}

module.exports = resultToRows;