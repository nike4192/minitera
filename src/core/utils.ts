
export function bta(n) {
	let a = [];
	while(n) {
		a.push(n & 1);
		n >>= 1;
	}
	return a.reverse();
}

export function atb(a) {
	return a.reduce((acc, b) => (acc | b) << 1, 0) >> 1;
}

export function exportFile(content, filename='data') {
    let a = document.createElement('a');
    a.setAttribute('href', content);
    a.setAttribute('download', filename);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export async function importFile(): Promise<File | null> {
	let input = document.createElement('input');
	input.type = 'file';
	input.multiple = false;
	input.style.display = 'none';
	document.body.appendChild(input);

	return new Promise((
		resolve: (file: File | null) => void
	) => {
		input.oninput = e => {
			resolve(input.files[0]);
			input.remove();
		}
		input.click();
	});
}

export function DirtyInheritance(a) {
	return function(b) {
		let {constructor, ...protoDescriptors} = Object.getOwnPropertyDescriptors(b.prototype);
		Object.defineProperties(a.prototype, protoDescriptors);
		let {prototype, ...descriptors} = Object.getOwnPropertyDescriptors(b);
		Object.defineProperties(a, descriptors);
	}
}
