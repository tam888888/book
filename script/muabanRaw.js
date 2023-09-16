import fs from "fs"
import { Exchange } from "./Exchange.js";
import { Config } from "./config.js";
import log4js from "log4js";
import { glob, globSync, globStream, globStreamSync, Glob } from 'glob'
var logger = log4js.getLogger();
import xlsx from "xlsx"
const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk) } })
const log = new Console({ stdout: ts })
import { Console } from 'node:console'
import { Transform } from 'node:stream'
import { e } from "mathjs";
import { start } from "repl";
import stats from "stats-analysis";
function getTable(data) {
    log.table(data)
    return (ts.read() || '').toString()
}

function writeArrayJson2Xlsx(filename, array) {
    let workbook = xlsx.utils.book_new();
    let worksheet = xlsx.utils.json_to_sheet(array);
    xlsx.utils.book_append_sheet(workbook, worksheet);
    xlsx.writeFile(workbook, filename);
}

log4js.configure({
    appenders: {
        everything: {
            type: "file", filename: "muaban.log", layout: {
                type: "pattern",
                pattern: "%m%n",
            },
        },
        console: {
            type: "console", layout: {
                type: "pattern",
                pattern: "%m%n",
            },
        },
    },
    categories: {
        default: { appenders: ["everything"], level: "debug" },
        app: { appenders: ["console"], level: "info" }
    },
});



let check = (val) => {
    if (val == undefined || Number.isNaN(val)) {
        return 0;
    }
    return val;
}
async () => {
    let dir = "./agg/all"
    let files = fs.readdirSync(dir);

    let symbolFiles = files.map(e => { return { symbol: e.substring(0, 3), datafile: dir + "/" + e } })

    console.table(symbolFiles)


    let stat = { req: 0, res: 0 }

    let sumField = Config.muabanSum()["sumField"];
    let sumFromDate = Config.muabanSum()["sumFromDate"];
    let sumToDate = Config.muabanSum()["sumToDate"];
    let data = []
    for (let e of symbolFiles) {
        // console.log(e)
        while (stat.req - stat.res >= 10) {
            await Exchange.wait(100);
        }
        stat.req++;
        let jsonData = fs.readFileSync(e.datafile)
        let json = new String(jsonData).toString().split("\n").map(e => {
            if (e.length > 0) {
                return JSON.parse(e)
            } else return []
        });

        // console.log(json)
        let out = []
        json.forEach(e => {
            out.push(...e.reverse())
        })
        stat.res++;
        // console.log(e.symbol, out.length)
        out = out.filter(e => e.datetime >= sumFromDate.getTime()).filter(e => e.datetime <= sumToDate.getTime())
        // console.log(e.symbol, out.length)
        // console.table(out[0])
        let sumSymbol = { symbol: e.symbol }
        sumField.forEach(f => {
            let dataf = out.map(e => check(e[f]))
            // console.log(f,dataf)
            let sum = dataf.reduce((a, b) => a + b, 0)

            sumSymbol[f] = sum;
        })
        // console.table(sumSymbol)
        data.push(sumSymbol);
        if (e.symbol == "HAG") {
            console.table(sumSymbol)
            // console.table(out)
        }

    }

    writeArrayJson2Xlsx("Sum.xlsx", data)

}


(async function (a, b) {
    //month -1
    let dateFrom = new Date(2023, 4, 1)
    let dateTo = new Date(2023, 4, 26)
    let dateShortFrom = new Date(2023, 4, 25)
    let meanvolLow = 5000;
    console.log("AVC", a, b)
    let check = (val) => {
        if (val == undefined || Number.isNaN(val)) {
            return 0;
        }
        return val;
    }
    const jsfiles = await glob('./trans/*/*.txt', { ignore: 'trans/20230425/*' })
    let mapFiles = {}
    let totalFiles = 0;


    jsfiles.forEach(
        e => {
            let symbol = e.slice(e.lastIndexOf("/") + 1, e.lastIndexOf("_"))
            if (symbol.length != 3) return;
            let date = e.slice(e.indexOf("/") + 1, e.lastIndexOf("/"))
            // console.log(symbol, date,e)

            let strdate0 = date;
            let strdate = strdate0.slice(0, 4) + "-" + strdate0.slice(4, 6) + "-" + strdate0.slice(6);
            // console.log(strdate)
            let time = new Date(strdate)
            if (time.getTime() >= dateFrom.getTime() && time.getTime() <= dateTo.getTime()) {
                console.log(strdate,e)
                totalFiles++;
                if (mapFiles[symbol] == undefined) mapFiles[symbol] = {}
                if (mapFiles[symbol][date] == undefined) mapFiles[symbol][date] = { symbol: symbol, date: date, file: e }
            }
        }
    )

    let stat = { req: 0, res: 0, total: totalFiles, start: Date.now() }

    let shortDays = {};
    Object.keys(mapFiles).forEach(s => {
        let sday = mapFiles[s];
        let count = 0;
        Object.keys(sday).forEach(k => {

            let strdate = k.slice(0, 4) + "-" + k.slice(4, 6) + "-" + k.slice(6);
            let time = new Date(strdate)
            if (time.getTime() >= dateShortFrom.getTime()) {
                count++;
            }
        })
        shortDays[s] = count;
    })
    // console.table(mapFiles)
    let dataStore = {};
    let HPG = mapFiles["HPG"];
    let moneyRatio = {}
    let numberField = ['price', 'change', 'match_qtty', 'datetime', 'total_vol']
    dataStore["HPG"] = { days: 0, shortDays: shortDays["HPG"], data: [] };
    Object.keys(HPG).forEach((k, i) => {
        stat.req++;
        let file = HPG[k].file;
        let data = fs.readFileSync(file, "utf-8")
        let strdate0 = k;
        let strdate = strdate0.slice(0, 4) + "-" + strdate0.slice(4, 6) + "-" + strdate0.slice(6);
        let ratio = 1;

        data = data.trim()
            .split('\n')
            .map(e => e.trim())
            .map(e => e.split(',').map(e => e.trim().replaceAll("\"", "")));
        let head = data[0];
        head = head.map(e => e.replaceAll("\"", ""));
        data = data.slice(1);
        if (data.length == 0) return;
        data = data.map(e => {
            let x = {};
            head.forEach((h, i) => {
                if (i >= e.length) return;
                x[h] = numberField.includes(h) ? +e[i] : e[i];
            });
            if (x.time != undefined) {
                x.datetime = (new Date(strdate + "T" + x.time)).getTime();
                if (x.datetime > (Date.now() + 7 * 60 * 60 * 1000)) {
                    console.log(symbol, file, e)
                }
            }
            if (x.price > 1000) {
                x.price = x.price / 1000
                ratio = 1000;
            }
            return x;
        })
        data.sort((a, b) => {
            let c = a.datetime - b.datetime;
            return c < 0 ? -1 : c > 0 ? 1 : 0
        })

        dataStore["HPG"].data.push(...data)
        // console.table(data)

        moneyRatio[k] = ratio;
        stat.res++

    })
    dataStore["HPG"].days = Object.keys(HPG).length;
    // console.table(moneyRatio)

    Object.keys(mapFiles).forEach(s => {
        let symbolData = mapFiles[s];
        dataStore[s] = { days: 0, data: [] }
        dataStore[s].days = Object.keys(symbolData).length
        dataStore[s].shortDays = shortDays[s]
        Object.keys(symbolData).forEach((k, i) => {
            stat.req++;
            let file = symbolData[k].file;
            let data = fs.readFileSync(file, "utf-8")
            let strdate0 = k;
            let strdate = strdate0.slice(0, 4) + "-" + strdate0.slice(4, 6) + "-" + strdate0.slice(6);

            data = data.trim()
                .split('\n')
                .map(e => e.trim())
                .map(e => e.split(',').map(e => e.trim().replaceAll("\"", "")));
            let head = data[0];
            head = head.map(e => e.replaceAll("\"", ""));
            data = data.slice(1);
            if (data.length == 0) return;
            data = data.map(e => {
                let x = {};
                head.forEach((h, i) => {
                    if (i >= e.length) return;
                    x[h] = numberField.includes(h) ? +e[i] : e[i];
                });
                if (x.time != undefined) {
                    x.datetime = (new Date(strdate + "T" + x.time)).getTime();
                    if (x.datetime > (Date.now() + 7 * 60 * 60 * 1000)) {
                        console.log(symbol, file, e)
                    }
                }
                x.price = x.price / moneyRatio[k];
                return x;
            })
            data.sort((a, b) => {
                let c = a.datetime - b.datetime;
                return c < 0 ? -1 : c > 0 ? 1 : 0
            })
            // console.table(data)
            dataStore[s].data.push(...data);
            stat.res++;

            if (stat.res % 10 == 0) {
                let r = stat.res / stat.total * 100
                stat.processed = Math.floor(r * 100) / 100 + "%"
                stat.second = (Date.now() - stat.start) / 1000
                stat.remainSecond = stat.second / r * 100 * (100 - r);
                console.table([stat])
            }
        }

        )

    }
    )

    let out = {}

    //Process Data here
    Object.keys(dataStore).forEach((s, i) => {
        let data = dataStore[s];
        if (data.data.length == 0) return;
        let map = data.data.map(e => {
            let val = check(e.price) * check(e.match_qtty) * 1000;
            let vol = check(e.match_qtty);
            return {
                val: val,
                vol: vol,
                val_bu: e.side == 'bu' ? val : 0,
                val_sd: e.side == 'sd' ? val : 0,
                val_uk: e.side == 'unknown' ? val : 0,
                vol_bu: e.side == 'bu' ? vol : 0,
                vol_sd: e.side == 'sd' ? vol : 0,
                vol_uk: e.side == 'unknown' ? vol : 0,
                datetime: e.datetime
            }
        })


        let sum = map.reduce((a, b) => {
            let ret = {}
            Object.keys(a).forEach(
                k => {
                    ret[k] = a[k] + b[k]
                }
            )
            return ret;
        }, {
            val: 0,
            vol: 0,
            val_bu: 0,
            val_sd: 0,
            val_uk: 0,
            vol_bu: 0,
            vol_sd: 0,
            vol_uk: 0,
        })

        let sumShort = map.filter(e => e.datetime >= dateShortFrom.getTime()).reduce((a, b) => {
            let ret = {}
            Object.keys(a).forEach(
                k => {
                    ret[k] = a[k] + b[k]
                }
            )
            return ret;
        }, {
            val: 0,
            vol: 0,
            val_bu: 0,
            val_sd: 0,
            val_uk: 0,
            vol_bu: 0,
            vol_sd: 0,
            vol_uk: 0,
        })

        if (map[0] == undefined) {
            console.log(s, data.data)
        }
        Object.keys(map[0]).forEach(
            k => {
                if (k == "datetime") return;
                sum["mean" + k] = Math.floor(sum[k] / data.days * 100) / 100;
                sum["meanShort" + k] = Math.floor(sumShort[k] / data.shortDays * 100) / 100;
                sum["Short" + k] = sumShort[k]
                sum["Ratio" + k] = Math.floor(sum["meanShort" + k] / sum["mean" + k] * 100) / 100;
            }
        )

        sum['symbol'] = s;
        sum['busd_val'] = sum.val_bu - sum.val_sd;
        sum['busd'] = sum.vol_bu - sum.vol_sd;
        sum['short_busd_val'] = sumShort.val_bu - sumShort.val_sd;
        sum['short_busd'] = sumShort.vol_bu - sumShort.vol_sd;
        out[s] = sum

    })
    let out1 = Object.values(out)

    out1 = out1.filter(e=>e['meanvol']>meanvolLow)
    let sortKey = 'Ratioval'
    out1.sort((a, b) => {
        return b[sortKey] - a[sortKey]
    })
    out1 = out1.map(e => {
        let e1 = {}
        e1.symbol = e.symbol;
        Object.keys(e).filter(e => e != "symbol").forEach(k => {
            e1[k] = e[k]
        })
        return e1;
    })
    // console.table(out1)

    writeArrayJson2Xlsx("SumRaw.xlsx", out1);
})(1, 2)


