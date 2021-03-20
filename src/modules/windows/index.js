// Requirimientos.
const {app, dialog, Menu, Tray, BrowserWindow} = require("electron");
const {servers} = require(`${app.getAppPath()}/src/modules/windows/handlers`);
const {language} = require(`${app.getAppPath()}/src/modules/languages`);
const fs = require("fs");
__dirname = app.getAppPath();

if(fs.existsSync(`${app.getPath("userData")}/lang.json`)){
	const lang = JSON.parse(fs.readFileSync(`${app.getPath("userData")}/lang.json`).toString()).lang;
	app.lang = language.Get(lang);
	language.Set(lang);
}else{
	app.lang = language.Get("ES");
}

// Ventana Principal
exports.MainWindow = () => {

	this.window = new BrowserWindow({
		show: false,
		webPreferences:{
			nodeIntegration: true
		}
	});

	this.window.loadURL(`${__dirname}/src/views/main/index.html`);

	// Menu de nuestra aplicacion del area de notificaciones ("Tray Menu App");
	this.TrayTemplate = [
		{label: app.lang.LabelAddServer, click: () => { servers.new() }, icon: `${app.getAppPath()}/src/images/add.png`}, // Abrimos la interfaz para generar un nuevo servidor.
		{label: app.lang.LabelLanguages, submenu: [
			{label: app.lang.LabelESLang, icon: `${app.getAppPath()}/src/images/es.png`, click: () => { language.Save("ES") }},
			{label: app.lang.LabelUSLang, icon: `${app.getAppPath()}/src/images/us.png`, click: () => { language.Save("US") }}
		], icon: `${app.getAppPath()}/src/images/${language.GetCurrentName().toLowerCase()}.png`},
		{label: app.lang.LabelExit, click: () => { this.window.destroy() }, icon: `${app.getAppPath()}/src/images/quit.png`} // Salimos de la aplicacion.
	];
	this.Tray = new Tray(`${__dirname}/icon.png`);

	// Se envia una notificacion al usuario desde la aplicacion en el area de notificacion.
	this.notify = (object) => {
		this.Tray.displayBalloon(object);
	}

	this.setTray = () => {
		this.trayMenu = Menu.buildFromTemplate(this.TrayTemplate);
		this.Tray.setToolTip("TrinityTools BG-Server");
		this.Tray.setContextMenu(this.trayMenu);
	}

	this.window.once("ready-to-show", () => {
		if(fs.existsSync(`${app.getPath("userData")}/servers.json`)){
			const saveServers = JSON.parse( fs.readFileSync(`${app.getPath("userData")}/servers.json`).toString() );
			const response = dialog.showMessageBoxSync({
				icon: `${app.getAppPath()}/icon.png`,
				title: app.lang.TitleDetectedServers,
				message: app.lang.MessageDetectedServers,
				detail: app.lang.DetailsDetectedServers,
				buttons: ["No", "Yes"]
			});
			if(response){
				servers.load(saveServers);
			}
		}
		this.notify({
			icon: `${app.getAppPath()}/icon.png`,
			title: app.lang.TitleReadyApp,
			content: app.lang.ContentReadyApp
		});
		this.setTray();
	});

	this.window.on("closed", () => {
		app.quit();
	});

	exports.ObjectMainWindow = this.window;

	return this;
}