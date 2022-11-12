const fs = require('fs').promises;

async function merge() {
	let data1 = await fs.readFile('./src/client/self.js', 'utf8');
	let data2 = await fs.readFile('./src/client/index.mjs', 'utf8');
	await fs.writeFile('./src/client/index.mjs', data1 + data2);
}

merge();