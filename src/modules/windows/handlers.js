// Requirimientos.
const {app, shell, dialog, ipcMain} = require("electron");
const {execFile, spawn, spawnSync} = require("child_process");
const {IO} = require(`../io`);
const fs = require("fs");
const {language} = require(`${app.getAppPath()}/src/modules/languages`);
__dirname = app.getAppPath();

ipcMain.on("new-dataServer", (event, dataServer) => {
	servers.add(dataServer);
});

const servers = {

	list: [],

	// Abrimos la interfaz para completar la informacion del nuevo servidor.
	new(){
		new IO();
	},

	// Añadimos un nuevo servidor a la lista de servidores.
	add(dataServer){
		const id = this.list.length;
		this.list.push({
			id: id,
			status: "offline",
			auto: false,
			name: dataServer.name,
			path: dataServer.directory,
			exec: {
				auth: null,
				world: null
			},
			log: dataServer.directory+"\\Server.log"
		});
		this.createItem(this.list[id]);
	},

	// Crea los menus y submenus del servidor que se acaba de crear.
	createItem(server){
		if(app.main.TrayTemplate.length === 3){
			app.main.TrayTemplate.splice(1, 0, {label: app.lang.LabelServersList, submenu: [], icon: `${app.getAppPath()}/src/images/server.png`});
			app.main.TrayTemplate.splice(2, 0, {label: app.lang.LabelSaveServers, icon: `${app.getAppPath()}/src/images/save.png`, click: () => { this.save() }});
		}
		const item = {
			label: server.name,
			id: server.id,
			submenu: [ // Lista de botones para el nuevo servidor.
				{label: app.lang.LabelStartServer, click: () => { this.spawnServer(server) }, icon: `${app.getAppPath()}/src/images/run.png`}, 				// Iniciar servidor.
				{label: app.lang.LabelAuthStart, click: () => { this.spawnAuth(server) }, icon: `${app.getAppPath()}/src/images/run.png`},					// Iniciar authserver
				{label: app.lang.LabelWorldStart, click: () => { this.spawnWorld(server) }, icon: `${app.getAppPath()}/src/images/run.png`},				// Iniciar worldserver
				{label: app.lang.LabelAutoStartNot, click: () => { this.autoStart(server) }, icon: `${app.getAppPath()}/src/images/auto-disable.png`},		// Auto inicializar
				{label: app.lang.LabelShowLogs, click: () => { this.showLogs(server) }, icon: `${app.getAppPath()}/src/images/logs.png`},					// Mostrar registros del servidor
				{label: app.lang.LabelDeleteServer, click: () => { this.removeServer(server) }, icon: `${app.getAppPath()}/src/images/close.png`}			// Eliminar servidor
			],
			icon: `${app.getAppPath()}/src/images/${server.status}.png`
		};
		app.main.TrayTemplate[1].submenu.push(item);
		app.main.setTray();
	},

	// Carga los servidores guardados.
	load(server){
		app.main.TrayTemplate.splice(1, 0, {label: app.lang.LabelServersList, submenu: [], icon: `${app.getAppPath()}/src/images/server.png`});
		app.main.TrayTemplate.splice(2, 0, {label: app.lang.LabelSaveServers, icon: `${app.getAppPath()}/src/images/save.png`, click: () => { this.save() }});
		server.forEach((value, index) => {
			const item = {
				label: server[index].name,
				id: server[index].id,
				submenu: [
					{label: app.lang.LabelStartServer, click: () => { this.spawnServer(server[index]) }, icon: `${app.getAppPath()}/src/images/run.png`},
					{label: app.lang.LabelAuthStart, click: () => { this.spawnAuth(server[index]) }, icon: `${app.getAppPath()}/src/images/run.png`},
					{label: app.lang.LabelWorldStart, click: () => { this.spawnWorld(server[index]) }, icon: `${app.getAppPath()}/src/images/run.png`},
					{label: server[index].auto ? app.lang.LabelAutoStartYes : app.lang.LabelAutoStartNot, click: () => { this.autoStart(server[index]) }, icon: `${app.getAppPath()}/src/images/${server[index].auto ? "auto-enable" : "auto-disable"}.png`},
					{label: app.lang.LabelShowLogs, click: () => { this.showLogs(server[index]) }, icon: `${app.getAppPath()}/src/images/logs.png`},
					{label: app.lang.LabelDeleteServer, click: () => { this.removeServer(server[index]) }, icon: `${app.getAppPath()}/src/images/close.png`}
				],
				icon: `${app.getAppPath()}/src/images/${server[index].status}.png`
			};
			app.main.TrayTemplate[1].submenu.push(item);
			// Añadir el servidor a la lista de servidores actuales.
			this.list.push(server[index]);
		});
		app.main.setTray();
	},

	save(){
		const saveDir = app.getPath("userData");
		this.list.forEach((value, index) => {
			this.list[index].exec = {auth: null, world: null};
		});
		fs.writeFileSync(`${app.SERVERS_DIR}`, JSON.stringify(this.list));
		app.main.notify({
			icon: `${app.getAppPath()}/icon.png`,
			title: app.lang.TitleSavedServers,
			content: app.lang.MessageSavedServers
		});
	},

	removeServer(server){
		const index = this.list.indexOf(server);
		this.list.splice(index, 1);
		app.main.TrayTemplate[1].submenu.splice(index, 1);
		app.main.setTray();
	},

	spawnServer(server){
		this.spawnAuth(server);
		this.spawnWorld(server);
	},

	spawnAuth(server){
		this.killAuthIfExists(server);
		server.exec.auth = spawn(`${server.path}\\authserver.exe`, {cwd: server.path});
	},

	spawnWorld(server){
		this.killWorldIfExists(server);
		setTimeout(() => {
			server.exec.world = spawn(`${server.path}\\worldserver.exe`, {cwd: server.path});
			app.main.notify({
				icon: `${app.getAppPath()}/icon.png`,
				title: `${app.lang.TitlePendingServer.replace("{server_name}", server.name)}`,
				content: `${app.lang.ContentPendingServer.replace("{server_name}", server.name)}`
			});
			app.main.TrayTemplate[1].submenu[server.id].icon = `${app.getAppPath()}/src/images/pending.png`;
			app.main.setTray();
			this.loadLogs(server);
		}, 1500);
	},

	killAuthIfExists(server){
		if(server.exec.auth && !server.exec.auth.killed){
			server.exec.auth.kill();
		}
	},

	killWorldIfExists(server){
		if(server.exec.world && !server.exec.world.killed){
			server.exec.world.kill();
		}
	},

	killServerIfExists(server){
		if(server.exec.auth && !server.exec.auth.killed){
			server.exec.auth.kill();
		}
		if(server.exec.world && !server.exec.world.killed){
			server.exec.world.kill();
		}
	},

	authExists(server){
		if(server.exec.auth && !server.exec.auth.killed){
			return true;
		}
		return false;
	},

	worldExists(server){
		if(server.exec.world && !server.exec.world.killed){
			return true;
		}
		return false;
	},

	stopServer(server){
		if(this.authExists(server)){
			server.exec.auth.kill();
		}
		if(this.worldExists(server)){
			server.exec.world.kill();
		}
	},

	// Abre y muestra los registros del worldserver.exe
	showLogs(server){
		shell.openPath(`${server.log}`);
	},

	// Detecta cuando el servidor esta online / offline y manda un mensaje.
	loadLogs(server){
		server.exec.world.stdout.on("data", (dataBuffer) => {
			const buffer = Buffer.from(dataBuffer).toString();
			if(buffer.split("World initialized").length === 2){ // Ejecutar cuando el servidor se pone online.
				app.main.notify({
					icon: `${app.getAppPath()}/icon.png`,
					title: `${app.lang.TitleOnlineServer.replace("{server_name}", server.name)}`,
					content: `${app.lang.ContentOnlineServer.replace("{server_name}", server.name)}`
				});
				// Actualizar botones de la aplicacion.
				app.main.TrayTemplate[1].submenu[server.id].icon = `${app.getAppPath()}/src/images/online.png`;
				app.main.TrayTemplate[1].submenu[server.id].submenu[0].label = app.lang.LabelStopServer;
				app.main.TrayTemplate[1].submenu[server.id].submenu[0].click = () => { this.stopServer(server) };
				app.main.TrayTemplate[1].submenu[server.id].submenu[0].icon = `${app.getAppPath()}/src/images/stop.png`;
				app.main.TrayTemplate[1].submenu[server.id].submenu[1].label = this.authExists(server) ? app.lang.LabelAuthStop : app.lang.LabelAuthStart;
				app.main.TrayTemplate[1].submenu[server.id].submenu[1].icon = this.authExists(server) ? `${app.getAppPath()}/src/images/stop.png` : `${app.getAppPath()}/src/images/run.png`;
				app.main.TrayTemplate[1].submenu[server.id].submenu[2].label = app.lang.LabelWorldStop;
				app.main.TrayTemplate[1].submenu[server.id].submenu[2].icon = `${app.getAppPath()}/src/images/stop.png`;
				app.main.setTray();
			}

			if(buffer.split("Halting process").length === 2){ // Ejecutar cuando el servidor se apaga.
				if(server.auto){
					this.spawnWorld(server);
				}
			}
		});
		server.exec.world.stdout.on("close", () => {
			app.main.notify({
				icon: `${app.getAppPath()}/icon.png`,
				title: `${app.lang.TitleOfflineServer.replace("{server_name}", server.name)}`,
				content: `${app.lang.ContentOfflineServer.replace("{server_name}", server.name)}`
			});
			app.main.TrayTemplate[1].submenu[server.id].icon = `${app.getAppPath()}/src/images/offline.png`;
			app.main.TrayTemplate[1].submenu[server.id].submenu[0].label = app.lang.LabelStartServer;
			app.main.TrayTemplate[1].submenu[server.id].submenu[0].click = () => { this.spawnServer(server) };
			app.main.TrayTemplate[1].submenu[server.id].submenu[0].icon = `${app.getAppPath()}/src/images/run.png`;
			app.main.TrayTemplate[1].submenu[server.id].submenu[1].label = app.lang.LabelAuthStart;
			app.main.TrayTemplate[1].submenu[server.id].submenu[1].icon = `${app.getAppPath()}/src/images/run.png`;
			app.main.TrayTemplate[1].submenu[server.id].submenu[2].label = app.lang.LabelWorldStart;
			app.main.TrayTemplate[1].submenu[server.id].submenu[2].icon = `${app.getAppPath()}/src/images/run.png`;
			app.main.setTray();
		});
	},

	// Activa / Desactiva la opcion para auto inicializar el servidor cuando se reinicia.
	autoStart(server){
		server.auto = !server.auto;
		const title = server.auto ? app.lang.TitleAutoStartYes : app.lang.TitleAutoStartNot;
		const content = server.auto ? app.lang.MessageAutoStartYes : app.lang.MessageAutoStartNot;
		app.main.notify({
			icon: `${app.getAppPath()}/icon.png`,
			title: title,
			content: content
		});
		app.main.TrayTemplate[1].submenu[server.id].submenu[3].label = server.auto ? app.lang.LabelAutoStartYes : app.lang.LabelAutoStartNot;
		app.main.TrayTemplate[1].submenu[server.id].submenu[3].icon = `${server.auto ? app.getAppPath()+"/src/images/auto-enable" : app.getAppPath()+"/src/images/auto-disable"}.png`;
		app.main.setTray();
	}

};

module.exports = { servers };