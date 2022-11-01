
function bta(n) {
	let a = [];
	while(n) {
		a.push(n & 1);
		n >>= 1;
	}
	return a.reverse();
}

function atb(a) {
	return a.reduce((acc, b) => (acc | b) << 1, 0) >> 1;
}

function exportFile(content, filename='data') {
    let a = document.createElement('a');
    a.setAttribute('href', content);
    a.setAttribute('download', filename);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function importFile() {
	let input = document.createElement('input');
	input.type = 'file';
	input.multiple = false;
	input.style.display = 'none';
	document.body.appendChild(input);
	return new Promise((resolve, reject) => {
		input.oninput = e => {
			resolve(input.files[0]);
			input.remove();
		}
		input.click();
	});
}

export {
	atb, bta,
	exportFile,
	importFile
};
