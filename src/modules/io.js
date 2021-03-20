const {app, Menu, ipcMain, BrowserWindow} = require("electron");
class IO{

	constructor(){
		this.NewServer();
	}

	NewServer(){
		this.window = new BrowserWindow({
			icon: `${app.getAppPath()}/icon.png`,
			title: app.lang.TitleNewServer,
			width: 450,
			height: 280,
			show: false,
			resizable: false,
			modal: true,
			center: true,
			webPreferences: {
				nodeIntegration: true
			}
		});
		Menu.setApplicationMenu(null);
		this.window.loadURL(`${app.getAppPath()}/src/views/new_server.html`);
		this.window.once("ready-to-show", () => {
			this.window.show();
		});
		ipcMain.on("close", () => {
			this.window.destroy();
		});
		return this.window;
	}

}

module.exports = { IO };