const {ipcRenderer} = require('electron');

window.addEventListener('DOMContentLoaded', () => {
	const element = document.getElementById('percentage');
	ipcRenderer.on('msg', (data, args) => {
		element.innerText = args + '%';
	});
});
