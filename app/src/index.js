const {app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const {query_game_state} = require('./game.js');

const createWindow = () => {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 600,
		resizable: true,
		backgroundColor: '#00000000',
		webPreferences: {
			nodeIntegration: true,
			preload: path.join(__dirname, 'preload.js')
		},
	});

	// and load the index.html of the app.
	mainWindow.loadFile('src/index.html');
	const menu = Menu.buildFromTemplate([]);

	Menu.setApplicationMenu(menu);

	// Open the DevTools.
	mainWindow.webContents.openDevTools();

	setInterval(async () => {
		try {
			const [state, side] = await query_game_state();
			let response = await fetch('https://api.whoisfahd.dev/canwin', {
				method: 'GET',
				headers: {
					state: JSON.stringify(state)
				}
			});
			response = await response.text();
			response = parseFloat(response);
			if (side == 'CHAOS') {
				response = 1 - response;
			}
			response *= 100;
			response = parseInt(response);
			mainWindow.webContents.send('msg', response);
		} catch(e) {
			console.log(e);
		}
	}, 5000);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	createWindow();

	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
