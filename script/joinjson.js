import puppeteer from "puppeteer";
import request_client from 'request-promise-native'
import xlsx from "xlsx"
import fs from "fs";
import { Console } from 'node:console'
import { Transform } from 'node:stream'

const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk) } })
const log = new Console({ stdout: ts })

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


async function main(){
    var myArgs = process.argv.slice(2);
    var files = myArgs[0];
    if (!files) return;
    // var tokens = files.split(",");
    var tokens = Array.from(myArgs);
    console.table(tokens)
    let all = {}
    let tokenData = tokens.map(e => {
      return { file: e, data: fs.readFileSync(e, "utf-8").split("\n").filter(e=>e.length>0).map(e => {
        let d = JSON.parse(e)
        all[d.id] = d;

      }) }
    })
    writeArrayJson2Xlsx("spa.xlsx",Object.values(all))
    console.log(Object.keys(all).length)
}

await main()
console.log("Done!")