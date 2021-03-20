window.onload = () => {

    $(".name").html(app.lang.LabelNewServerName);
    $(".directory").html(app.lang.LabelNewServerDir);
    $("#save").html(app.lang.ButtonAddServer);

    $("#save").on("click", () => {
        const name = document.getElementById("name").value;
        const directory = document.getElementById("directory").value;
        if(!directory || !name) { return false }
        ipcRenderer.send("new-dataServer", {
            name: name,
            directory: directory
        });
        ipcRenderer.send("close"); // Cerramos la ventana al terminar de enviar los datos.
    });
    $("#choose").on("click", SelectDirectory);
}

SelectDirectory = () => {
    const directory = dialog.showOpenDialogSync({
        title: `${app.lang.TitleChooseServer}`,
        defaultPath: app.getPath("desktop"),
        properties: ["openDirectory"]
    });
    if(!directory){ return false }
    document.getElementById("directory").value = directory;
};