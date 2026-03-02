function encode(value) {
	// Bun SQL rejects proxied objects as PG params; normalize to plain JSON value.
	return JSON.parse(JSON.stringify(value));
}

module.exports = encode;
