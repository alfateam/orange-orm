let cluster =  {customFilters: {a: function bar(){}}};

function getLeafNodes(obj, result = {}){
	for(let p in obj) {
		if (typeof obj[p] === 'object' && obj[p] !== null)
			getLeafNodes(obj[p], result);
		else
			result[p] = true;
	}
	return result;
}


console.log(getLeafNodes(cluster));
console.log(getLeafNodes());