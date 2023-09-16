import { Exchange } from "./Exchange.js";
import fetch from "node-fetch";
import request from 'request'
import puppeteer from "puppeteer";
import http from "node:http";
import https from "node:https";
import { Console } from 'node:console'
import { Transform } from 'node:stream'
import fs from "fs";
import { Parser } from "json2csv"
import path from "path";

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
const agent = (_parsedURL) => _parsedURL.protocol == 'http:' ? httpAgent : httpsAgent;


function getNow() {
    let fd = new Date();
    return fd.getFullYear()
        + "" + (fd.getMonth() + 1 < 10 ? "0" + (fd.getMonth() + 1) : fd.getMonth() + 1)
        + "" + (fd.getDate() < 10 ? "0" + fd.getDate() : fd.getDate());
}


(async () => {

    let dto = Date.now() / 1000 + 7 * 60 * 60
    let dfrom = new Date(dto - 1 * 24 * 60 * 60);
    let s = await Exchange.vndGetAllSymbols();
    // console.table(sym)
    s = s.map(e => e.code).filter(e => { return e.length == 3 });
    let symbols = s;//['PRE','GIC'];
    const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk) } })
    const logger = new Console({ stdout: ts })

    function getTable(data) {
        logger.table(data)
        return (ts.read() || '').toString()
    }

    let stat = { req: 0, res: 0 }

    console.log(symbols)
    symbols.push('VNINDEX')
    symbols.push('VN30')
    symbols.push('HNX')
    symbols.push('HNX30')
    symbols.push('UPCOM')

    let dir = "./stat/" + getNow() + "/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    } else {
      let files = fs.readdirSync(dir);
      for (const file of files) {
        fs.unlinkSync(path.join(dir, file));
      }
    }

    for (let symbol of symbols) {
        console.log(symbol)
        let a = fetch("https://histdatafeed.vps.com.vn/tradingview/history?symbol=" + symbol + "&resolution=5&from=" + dfrom + "&to=" + dto, {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7",
                "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site"
            },
            "referrer": "https://chart.vps.com.vn/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors",
            agent
        });
        stat.req++;
        // a.then(res=>res.json()).then(data=>{console.log(data); stat.res++;})
        a.then(res => res.json()).then(data => {
            // console.log(data)
            let z = data;
            stat.res++;
            if (z.o.length == 0) {
                return;
            }
            let z1 = z.o.map((e, i) => { return { c: z.c[i], h: z.h[i], l: z.l[i], o: z.o[i], t: z.t[i], v: z.v[i] } })

            let z2 = z1.reduce((a, b) => { return { v: (a.v + b.v) } }, { v: 0 })

            let av = z2.v / z1.length
            let z3 = z1.map(e => {
                e['av'] = av; e['r'] = (e.v / av).toFixed(2);
                e.date = (new Date(e.t * 1000 + 7 * 60 * 60 * 1000)).toISOString();
                e.updown = (e.c > e.o) ? "up" : (e.c < e.o) ? "down" : "-";
                return e
            })

            


            const str = getTable(z3)
            console.log(str.length) // 105
            console.log(str)
            fs.writeFile(dir + symbol + "_report_5phut_table.txt", str, (e) => { })
            let csv = new Parser({ fields: Object.keys[z3[0]] });
            let data2 = csv.parse(z3);
            fs.writeFile(dir + + symbol + "_5phut_table.json", JSON.stringify(z3), (e) => { })
            fs.writeFile(dir + symbol + "_5phut_table.csv", data2, (e) => { })
        })

        while (stat.req - stat.res >= 50) {
            await Exchange.wait(100)
        }
        console.log(stat)

    }


})();