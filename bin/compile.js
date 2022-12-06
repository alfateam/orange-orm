let ts = require('typescript');
let path = require('path');

function compile(fileNames, options) {
	var program = ts.createProgram(fileNames, options);
	var emitResult = program.emit();
	ts.getPreEmitDiagnostics(program)
		.concat(emitResult.diagnostics);
	return emitResult.emitSkipped ? 1 : 0;
}

const defaultOptions = {
	noEmitOnError: false,
	noImplicitAny: true,
	target: ts.ScriptTarget.ES2020,
	module: ts.ModuleKind.CommonJS,
	esModuleInterop: true,
	outDir: 'build'
};

module.exports = function(file, options = {}) {
	let basename = path.basename(file, '.ts');
	options = { ...defaultOptions, ...options };
	if (compile([file], options) === 0)
		return path.join(options.outDir, `/${basename}.js`);
};
