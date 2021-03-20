const {app, dialog} = require("electron");
const fs = require("fs");
const language = {
    
    languages: JSON.parse( fs.readFileSync(`${app.getAppPath()}/src/json/languages.json`).toString() ),

    current: "ES",
    
    Get(lang){
        if(!this.languages[lang]){ return false };
        return this.languages[lang];
    },

    GetCurrentName(){
        return this.current;
    },

    Set(lang){
        this.current = lang;
    },

    Save(lang){
        const saveDir = app.getPath("userData");
        fs.writeFile(`${saveDir}/lang.json`, JSON.stringify({lang: lang}), () => {
            app.lang = this.Get(lang);
            this.Set(lang);
            const action = dialog.showMessageBoxSync({
                icon: `${app.getAppPath()}/icon.png`,
                title: app.lang.TitleRestartApp,
                message: app.lang.MessageRestartApp,
                detail: app.lang.DetailRestartApp,
                buttons: ["No", "Yes"]
            });
            if(action){
                app.relaunch();
                app.exit();
            }
        });
    }
}

module.exports = { language };