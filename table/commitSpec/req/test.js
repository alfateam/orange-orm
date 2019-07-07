let elements = [{ a: 1, name: 'Brånåsen'}, {a: 3, name: 'Alnabru'}, {a: 2, name: 'Brånåsen'}];

function groupBy(items, comparer) {
    return items.reduce((result, item, index, items) => {
        if (index === 0)
            result.push([item]);
        else {
            if (comparer(items[index-1], item) === 0)
                result[result.length -1].push(item);
            else
                result.push([item]);
        }
        return result;        
    }, []);
}

function sortComparer(el,el2) {
    return el.a - el2.a;
}

function groupComparer(el, el2) {
    if (el.name > el2.name)
        return 1;
    if (el.name > el2.name)
        return -1;
    return 0;
}

elements.sort(sortComparer);
let grouped = groupBy(elements, groupComparer);
console.log(grouped);


