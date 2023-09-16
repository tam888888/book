import fs from "fs"
import { Exchange } from "./Exchange.js";
import { Config } from "./config.js";
import log4js from "log4js";
var logger = log4js.getLogger();
import xlsx from "xlsx"
const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk) } })
const log = new Console({ stdout: ts })
import { Console } from 'node:console'
import { Transform } from 'node:stream'
import { e } from "mathjs";
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
(async () => {
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
        out = out.filter(e => e.datetime >= sumFromDate.getTime()).filter(e=>e.datetime<=sumToDate.getTime())
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
        if(e.symbol == "HAG"){
            console.table(sumSymbol)
            console.table(out)
        }

    }



    writeArrayJson2Xlsx("Sum.xlsx", data)

})()