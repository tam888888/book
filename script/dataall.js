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
    dateFrom.setDate(dateFrom.getDate() - 5);
    let simpleDateFrom = new Date()
    simpleDateFrom.setDate(simpleDateFrom.getDate() - 50);
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
    let jsfiles = await glob('./data/*HOSE_Data_All*.json', { ignore: 'trans/20230425/*' })
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

    let dataStore = [];

    listFiles.forEach(s => {
        let data = fs.readFileSync(s);
        let stockData = JSON.parse(data);
        dataStore.push(...stockData)
    }
    )

    // let dataStoreArray = []
    // Object.keys(dataStore).forEach((s, i) => {
    //     let data = dataStore[s]

    //     const filteredData = Object.fromEntries(
    //         Object.entries(data).filter(([key, value]) => value !== 0)
    //     );
    //     let newData = {}        
    //     for (let key in filteredData) {
    //         newData[mapkey[key]] = filteredData[key]
    //     }
    //     // console.table(newData)
    //     newData.total = (newData.bu == undefined? 0:newData.bu ) + (newData.sd == undefined? 0:newData.sd ) + (newData.uk == undefined? 0:newData.uk )
    //     newData.totalVal = (newData.buval == undefined? 0:newData.buval ) + (newData.sdval == undefined? 0:newData.sdval ) + (newData.ukval == undefined? 0:newData.ukval )
    //     newData.table = getTable(newData);
    //     newData.price = +newData.price;
    //     dataStoreArray.push(newData)
    // })

    writeArrayJson2Xlsx("./filter/DataAll.xlsx", dataStore);

    listFiles.length = 0;
    dataStore.length = 0;
    jsfiles = await glob('./data/*HOSE_Simple_Data_All*.json', { ignore: 'trans/20230425/*' })
    listFiles = []
    console.table(jsfiles)

    dateFrom = simpleDateFrom;
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

    dataStore = [];

    listFiles.forEach(s => {
        let data = fs.readFileSync(s);
        let stockData = JSON.parse(data);
        dataStore.push(...stockData)
    }
    )
    writeArrayJson2Xlsx("./filter/SimpleDataAll.xlsx", dataStore);
})(1, 2)


