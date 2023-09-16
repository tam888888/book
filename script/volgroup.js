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
    let dateFrom = new Date() 
    dateFrom.setDate(dateFrom.getDate() - 100);
    let dateTo = new Date(2023, 10, 26)
    let dateShortFrom = new Date(2023, 4, 25)
    let meanvolLow = 5000;
    console.log("AVC", a, b)
    let check = (val) => {
        if (val == undefined || Number.isNaN(val)) {
            return 0;
        }
        return val;
    }
    const jsfiles = await glob('./data/*Vol_Group*.json', { ignore: 'trans/20230425/*' })
    let listFiles = []
    console.table(jsfiles)

    jsfiles.forEach(
        e => {
            let date = e.slice(e.lastIndexOf("_") + 1, e.lastIndexOf("."))
            console.log(date, e)

            let strdate0 = date;
            let strdate = strdate0.slice(0, 4) + "-" + strdate0.slice(4, 6) + "-" + strdate0.slice(6);
            // console.log(strdate)
            let time = new Date(strdate)
            if (time.getTime() >= dateFrom.getTime() && time.getTime() <= dateTo.getTime()) {
                console.log(strdate, e)
                listFiles.push(e)
            }
        }
    )

    let stat = { req: 0, res: 0, total: listFiles.length, start: Date.now() }

    // console.table(mapFiles)
    let dataStore = {};

    let moneyRatio = {}
    let numberField = ['price', 'change', 'match_qtty', 'datetime', 'total_vol']


    listFiles.forEach(s => {
        let data = fs.readFileSync(s);
        let stockData = JSON.parse(data);
        stockData.forEach(e => {
            if (!dataStore[e.symbol + "" + e.price]) dataStore[e.symbol + "" + e.price] = e;
            else {
                let oe = dataStore[e.symbol + "" + e.price];
                Object.keys(oe).forEach(oee => {
                    if (oee != "symbol" && oee != "price") {
                        oe[oee] += e[oee]
                    }
                })
                dataStore[e.symbol + "" + e.price] = oe
                // console.log("11111")                
                // console.table(oe)
                // console.log("11112")
                // console.table(e)
            }
        })
    }
    )

    let out = {}

    //Process Data here

    let mapkey = {
        'symbol': 'symbol',
        'price': 'price',
        'bu': 'bu',
        'sd': 'sd',
        'unknown': 'uk',
        'buval': 'buval',
        'bu-c': 'bu-c',
        'sdval': 'sdval',
        'sd-c': 'sd-c',
        'unknownval': 'ukval',
        'unknown-c': 'uk-c',
        '1000-bu': '1K-bu',
        '1000-bu-c': '1K-bu-c',
        '1000-sd': '1K-sd',
        '1000-sd-c': '1K-sd-c',
        '1000-unknown': '1K-uk',
        '1000-unknown-c': '1K-uk-c',
        '10000-bu': '10K-bu',
        '10000-bu-c': '10K-bu-c',
        '10000-sd': '10K-sd',
        '10000-sd-c': '10K-sd-c',
        '10000-unknown': '10K-uk',
        '10000-unknown-c': '10K-uk-c',
        '50000-bu': '50K-bu',
        '50000-bu-c': '50K-bu-c',
        '50000-sd': '50K-sd',
        '50000-sd-c': '50K-sd-c',
        '50000-unknown': '50K-uk',
        '50000-unknown-c': '50K-uk-c',
        '200000-bu': '200K-bu',
        '200000-bu-c': '200K-bu-c',
        '200000-sd': '200K-sd',
        '200000-sd-c': '200K-sd-c',
        '200000-unknown': '200K-uk',
        '200000-unknown-c': '200K-uk-c',
        '500000-bu': '500K-bu',
        '500000-bu-c': '500K-bu-c',
        '500000-sd': '500K-sd',
        '500000-sd-c': '500K-sd-c',
        '500000-unknown': '500K-uk',
        '500000-unknown-c': '500K-uk-c',
        '20000000-bu': '20M-bu',
        '20000000-bu-c': '20M-bu-c',
        '20000000-sd': '20M-sd',
        '20000000-sd-c': '20M-sd-c',
        '20000000-unknown': '20M-uk',
        '20000000-unknown-c': '20M-uk-c',
    }

    let dataStoreArray = []
    Object.keys(dataStore).forEach((s, i) => {
        let data = dataStore[s]

        const filteredData = Object.fromEntries(
            Object.entries(data).filter(([key, value]) => value !== 0)
        );
        let newData = {}        
        for (let key in filteredData) {
            newData[mapkey[key]] = filteredData[key]
        }
        // console.table(newData)
        newData.total = (newData.bu == undefined? 0:newData.bu ) + (newData.sd == undefined? 0:newData.sd ) + (newData.uk == undefined? 0:newData.uk )
        newData.totalVal = (newData.buval == undefined? 0:newData.buval ) + (newData.sdval == undefined? 0:newData.sdval ) + (newData.ukval == undefined? 0:newData.ukval )
        newData.table = getTable(newData);
        newData.price = +newData.price;
        dataStoreArray.push(newData)
    })

    // console.table(dataStore)
    let out1 = Object.values(out)

    out1 = out1.filter(e => e['meanvol'] > meanvolLow)
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

    writeArrayJson2Xlsx("./filter/VolGroup.xlsx", dataStoreArray);
})(1, 2)


