const bitcoin = require('bitcoin-address-generator');
const https = require('https'); 
const asciiart = require('figlet');
const fs = require('fs');
const api = "https://api-r.bitcoinchain.com/v1/address/";
let count = 0;
main();

function main()
{
    console.log(asciiart.textSync("thi3fmin32"));
    setInterval(() => run(), 1010);
}

function run()
{
    count++;
    log("starting run " + count);
    let wallets = [];
    for (let i = 0; i < 100; i++)
        bitcoin.createWalletAddress((w) => { wallets.push(w) });
    
    checkBalance(wallets);
}

function checkBalance(wallets)
{
    let url = api + wallets.map(w => w.address).join(',');
    let request = https.get(url)

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
                    }
                }
            } 
            catch (e) 
            {
                error("requesting balance failed:" + e.message);
            }
        });

        request.end();

    });
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