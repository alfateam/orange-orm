#! /usr/bin/env node
const build = require('./build');
const generateTriggers = require('./generate-triggers');

async function main() {
	const args = process.argv.slice(2);
	if (args.length === 0)
		return build(process.cwd());

	const command = args[0];
	if (command === 'generate-triggers' || command === 'sync:triggers')
		return generateTriggers(process.cwd(), args.slice(1));

	return build(process.cwd());
}

main().catch((err) => {
	console.error(err?.stack || err?.message || err);
	process.exit(1);
});
