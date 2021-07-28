let tryGetFromCacheById = require('./tryGetFromCacheById');
let getFromDbById = require('./getFromDbById');
let resultToPromise = require('./resultToPromise');
let extractStrategy = require('./tryGetFromDbById/extractStrategy');

async function getById() {
	let strategy = extractStrategy.apply(null, arguments);
	let cached =  tryGetFromCacheById.apply(null,arguments);
	if (cached) {
		await expand(cached, strategy);
		return resultToPromise(cached);

	}
	return getFromDbById.apply(null,arguments);
}

getById.exclusive = getFromDbById.exclusive;

async function expand(rows, strategy) {
	if (!rows)
		return;
	if (!Array.isArray(rows))
		rows = [rows];
	for(let p in strategy) {
		if(!(strategy[p] === null || strategy[p]))
			continue;
		for (let i = 0; i < rows.length; i++) {
			await expand(await rows[i][p], strategy[p]);			
		}
	}
}

module.exports = getById;