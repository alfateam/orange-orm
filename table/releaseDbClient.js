function release() {
	var done = process.domain.dbClientDone;
	if (done)
		done();
}

module.exports = release;