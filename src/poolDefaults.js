module.exports = {
	//Connection pool options - see https://github.com/coopernurse/node-pool
	//number of connections to use in connection pool
	//0 will disable connection pooling
	poolSize: 0,

	//max milliseconds a client can go unused before it is removed
	//from the pool and destroyed
	poolIdleTimeout: 30000,

	//frequeny to check for idle clients within the client pool
	reapIntervalMillis: 1000,

};