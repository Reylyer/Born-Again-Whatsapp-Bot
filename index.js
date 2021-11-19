const { Client } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal');
const fs = require("fs")
const mkdirp = require("mkdirp");

const SESSION_FILE_PATH = "./session.json"
const CPREFIX = "s-"
const PRESET_FILE_PATH = "./preset.json"

let sessiondata
let noSession

if(!fs.existsSync(PRESET_FILE_PATH)){
    fs.writeFileSync(PRESET_FILE_PATH, "{}")
}
let preset = require(PRESET_FILE_PATH)

if(fs.existsSync(SESSION_FILE_PATH)){
    console.log("session route")
    sessiondata = require(SESSION_FILE_PATH)
} else {
    noSession = true
}
const client = new Client({
    session: sessiondata
});


if(noSession){
    console.log("qr route")
    client.on('qr', qr => {
        qrcode.generate(qr, {small: true});
    })
}

client.on("authenticated", (session) => {
    sessiondata = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if(err){
            console.error(err);
        }
    });
});

client.on("auth_failure", msg =>{
    console.log('\n Event AUTH_FAILURE', new Date())
})

client.on("ready", () => {
    console.log("Client is ready!");
});

client.on('message', msg => {
    // if(msg.hasMedia){
    //     msg.downloadMedia().then()
    // }
    if(msg.body.length > 100){
        fs.writeFileSync("../pipe/piped.json", JSON.stringify(msg))
        return
    }
    if(!msg.body.startsWith(CPREFIX)) return
    let [command, ...args] = msg.body.split(" ")
    command = command.slice(CPREFIX.length)
    console.log(args)
    switch (command){
        case 'ping':
            msg.reply('pong')
            break
        case 'p':
        case 'pipe':
            if(msg.hasQuotedMsg){
                let header = "[HEADER]\n"
                if(args.length == 0){
                    // use default
                } else{
                    let i = 0
                    let j = 0
                    while(!args[i].endsWith("\n")){
                        switch(args[i]){
                            case "--use-preset":
                            case "-u":
                                if(args[i+1] in preset){
                                    header += `server=${preset[args[i+1]]}\nchannel=${preset[args[i+1]]}`
                                    j+=1
                                    break
                                } else{
                                    msg.reply(`no preset with name ${args[i+1]}`)
                                    return
                                }
                                
                            case "--server":
                            case "-s":
                                header += `server=${args[i+1]}`
                                break                                
                            case "--channel":
                            case "-c":
                                header += `channel=${args[i+1]}`
                                break
                        }
                        header += "\n"
                        i += 2
                        j += 1
                        if(j > 2){
                            break
                        }
                    }
                }
                header += "[END OF HEADER]\n"
                msg.getQuotedMessage().then(mesq => {
                    fs.writeFileSync("./piped.txt", mesq.body)
                    msg.reply("Quoted message successfully piped!")
                }).catch(err => {
                    msg.reply("Something went wrong")
                    console.log(err)
                })
            } else{
                fs.writeFileSync("./piped.txt", args.join(" "))
                msg.reply("message successfully piped!")
            }
            break
        case 'mkpreset':


    }
})

client.initialize();