const bitcoin = require('bitcoin-address-generator');
const axios = require('axios'); 
const asciiart = require('figlet');
const fs = require('fs');

const API = "https://api-r.bitcoinchain.com/v1/address/";
const ONE_DAY = 86400000;
const SETTING_FILE = "setting.json";

let count = 0;
let slackWebhook = ""
let dailyCount = 0;
let totalCount = 0;
main();

async function main()
{
    console.log(asciiart.textSync("thi3fmin32"));

    let settings = readSetting();
    slackWebhook = settings.slack;
    dailyCount = settings.daily ? settings.daily : 0;
    totalCount = settings.total ? settings.daily : 0;

    await postSlack("starting \n```" + asciiart.textSync("thi3fmin32") + "```");
    setInterval(async () => await run(), 1010);

    setTimeout(async () => 
    {
        setInterval(async () => await report(), ONE_DAY);
        await report();
    }, getTimeTillXh(21)); 
}

async function run()
{
    count++;
    log("starting run " + count);
    let wallets = [];
    for (let i = 0; i < 100; i++)
        bitcoin.createWalletAddress((w) => { wallets.push(w) });
    
    await checkBalance(wallets);
    saveSettings();
}

async function checkBalance(wallets)
{
    let url = API + wallets.map(w => w.address).join(',');
    try
    {
        const response = await axios.get(url);
        if (response.data.length != wallets.length)
            error("missmatch between results and wallets");

        dailyCount += wallets.length;
        for (let i = 0; i < wallets.length; i++)
        {
            let wallet = wallets[i];
            let balance = response.data[i].balance ? response.data[i].balance : 0;
            log("address: " + wallet.address + " balance: " + balance);
            if (balance > 0)
            {
                console.log(asciiart.textSync("JACKPOT"));
                log("found: " + balance + " on address " + wallet.address + " with private key " + wallet.key);
                fs.appendFileSync('jackpot.csv', "" + wallet.key + ";" + wallet.address + ";" + balance);
                await postSlack("```" + ciiart.textSync("JACKPOT") + "```\n" + balance + " BTC");
            }
        }
    }
    catch (e)
    {
        error("requesting balance failed:" + e.message);
    }
}

function log(msg)
{
    let date = new Date();
    let time = "[" + date.toLocaleDateString() + " " + date.toLocaleTimeString() + "] ";
    console.log(time + msg);
}

function error(msg)
{
    let date = new Date();
    let time = "[" + date.toLocaleDateString() + " " + date.toLocaleTimeString() + "] ";
    console.error(time + msg);
}

function readSetting()
{
    if (!fs.existsSync(SETTING_FILE))
        return {};
    let data = fs.readFileSync(SETTING_FILE);
    return JSON.parse(data);
}

function saveSettings()
{
    var settings = 
    {
        "slack": slackWebhook,
        "daily": dailyCount,
        "total": totalCount,
    };
    fs.writeFile(SETTING_FILE, JSON.stringify(settings), () => {});
}

async function postSlack(msg)
{
    try
    {
        let payload = { "username": "thi3fmin32", "text": msg}
        await axios.post(slackWebhook, payload);     
    }
    catch (e)
    {
        error("failed posting to slack channel");
    }
}

async function report()
{
    totalCount += dailyCount;
    await postSlack("Checked " + dailyCount + " adresses today, totally " + totalCount + "\n =>" + (totalCount / Math.pow(2, 160)( + "%")));
    dailyCount = 0;
}

function getTimeTillXh(x)
{
    var now = new Date();
    var todayX = new Date();
    todayX.setHours(x,0,0,0);
    let timespan = todayX - now;
    if (timespan < 0)
        timespan + ONE_DAY;

    return timespan;
}
/*

    request.on('error', (err) => 
    {
        error("request failed: " + err.message);
    });

    request.on('response', (res) => 
    {
        if (res.statusCode !== 200)
        {
            error("requesting balance failed: status " + res.statusCode);
            return;
        }
    
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try 
            {
                const results = JSON.parse(rawData);
                if (results.length != wallets.length)
                    error("missmatch between results and wallets");

                for (let i = 0; i < wallets.length; i++)
                {
                    let wallet = wallets[i];
                    let balance = results[i].balance ? results[i].balance : 0;
                    log("address: " + wallet.address + " balance: " + balance);
                    if (balance > 0)
                    {
                        console.log(asciiart.textSync("JACKPOT"));
                        fs.appendFileSync('jackpot.csv', "" + wallet.key + ";" + wallet.address + ";" + balance);
                        https.post("https://hooks.slack.com/services/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", 
                    }
                }
            } 
            catch (e) 
            {
            }
        });

        request.end();

    });*/