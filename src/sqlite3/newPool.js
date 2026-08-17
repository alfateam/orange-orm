const promisify = require('../promisify');
const pools = require('../pools');
const end = require('./pool/end');
const newGenericPool = require('./pool/newGenericPool');
const newId = require('../newId');

function newPool(connectionString, poolOptions) {
	let pool = newGenericPool(connectionString, poolOptions);
	let id = newId();
	let boundEnd = end.bind(null, pool, id);
	let c = {};

	c.connect = pool.connect;
	c.end = promisify(boundEnd);
	c.__orangeCloneDatabaseTo = function(targetConnectionString) {
		return new Promise((resolve, reject) => {
			pool.connect((error, client, release) => {
				if (error)
					return reject(error);
				if (!client || typeof client.backup !== 'function') {
					release();
					return reject(new Error('SQLite client cannot clone a database.'));
				}
				Promise.resolve(client.backup(targetConnectionString))
					.then((result) => {
						release();
						resolve(result);
					}, (backupError) => {
						release(backupError);
						reject(backupError);
					});
			});
		});
	};
	pools[id] = c;
	return c;
}

module.exports = newPool;
