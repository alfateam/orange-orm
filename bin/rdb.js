#! /usr/bin/env node
const build = require('./build');
const generateTriggers = require('./generate-triggers');

async function main() {
	const args = process.argv.slice(2);
	const cwd = process.cwd();
	if (args.length === 0) {
		printHelp();
		return;
	}

	const command = args[0];
	if (command === '--help' || command === '-h' || command === 'help') {
		printHelp();
		return;
	}
	if (command === 'build')
		return build(cwd);
	if (command === 'sync:setup')
		return generateTriggers(cwd, args.slice(1));

	console.error(`Orange: unknown command "${command}"`);
	printHelp();
	process.exitCode = 1;
}

function printHelp() {
	console.log([
		'Usage:',
		'  orange-orm <command> [options]',
		'',
		'Commands:',
		'  build                         Generate typings from schema files.',
		'  sync:setup                    Setup triggers for two-way sync.',
		'  help                          Show this help.',
		''
	].join('\n'));
}

main().catch((err) => {
	console.error(err?.stack || err?.message || err);
	process.exit(1);
});
