const {app} = require("electron");
const windows = require(`${app.getAppPath()}/src/modules/windows/index`);
const InDevelopment = false; // Mantiene la actualizacion del programa en modo ejecucion.

app.allowRendererProcessReuse = true;

if(InDevelopment){
	require("electron-reload")(__dirname);
}

app.on("ready", () => {
	app.main = windows.MainWindow();
});