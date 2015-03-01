function endPool(connectionString, pgPool, pg, done) {
    pgPool.drain(onDrained);

    function onDrained() {
        pgPool.destroyAllNow();
        done();
    }
}

module.exports = endPool;
