// @ts-ignore
// eslint-disable-next-line no-undef
const deno = typeof Deno !== 'undefined' && Deno.version?.deno;
// @ts-ignore
// eslint-disable-next-line no-undef
const bun = typeof Bun !== 'undefined' && Bun.version;
const node = (typeof process !== 'undefined' && process.versions?.node && !deno && !bun) ? process.versions.node : false;

function parseVersion(version) {
	if (version) {
		const versionArray = version.split('.');
		return {
			version,
			major: parseInt(versionArray[0]),
			minor: parseInt(versionArray[1]),
			patch: parseInt(versionArray[2])
		};
	}
	else
		return false;
}


module.exports = { deno: parseVersion(deno), bun: parseVersion(bun), node: parseVersion(node) };