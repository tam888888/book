import fetch from "node-fetch";
import fs from "fs";
import log4js from "log4js";
import { Parser } from "json2csv"
import { Exchange } from "./Exchange.js";
import draftlog from 'draftlog'
import Table from "tty-table";
import CliTable3 from "cli-table3";
import chalk from "chalk";
import path from "path";
var logger = log4js.getLogger();
import { Console } from 'node:console'
import { Transform } from 'node:stream'
import { e } from "mathjs";
import xlsx from "xlsx"
import stats from "stats-analysis";
import { SMA, EMA, RSI, StochasticRSI, MACD, MFI, BollingerBands } from 'technicalindicators';
import { Config } from "./config.js";

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


let stockStore = {};
(() => {
  let data = fs.readFileSync('./profile/stock.json');
  let stockData = JSON.parse(data);
  stockData.forEach(e => {
    stockStore[e.Symbol] = e;
  })
  console.log("Loaded stockStore!")
})();


let sessionData = [5, 10, 20, 100, 200]
let fromDate = new Date(2022, 11, 10);
let dataModelPath = "./model/"


// main
let stockdata = {};
let checkSymbol = {};
let formater = new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 });

(async () => {
  let listSymbol = await Exchange.getlistallsymbol();
  listSymbol = listSymbol.filter((s) => {
    return s.length <= 3;
  })
  console.log(listSymbol.length)

  let asyncBatch = async () => {
    while (true) {
      let t = [2, 5, 10, 30, 60, 2 * 60, 3 * 60, 8 * 60]
      let from = t.map(e => {
        return Date.now() + 7 * 60 * 60 * 1000 - e * 60 * 1000
      })

      function date2str(date) {
        let t = date.getFullYear() + "-"
          + (date.getMonth() + 1 < 10 ? ("0" + (date.getMonth() + 1)) : date.getMonth() + 1) + "-"
          + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate())
        return t;
      }
      let strdate = date2str(new Date());
      try {

        let stat = {
          req: 0,
          res: 0
        }
        let table = [];
        let promise = new Promise(async (resolve) => {
          let ret = {};
          for (let symbol of listSymbol) {
            stat.req++;
            if (stat.req - stat.res >= 200) {
              await wait(100);
            }
            let a = {
              sd: 0,
              bu: 0,
              uk: 0
            }
            let z = Exchange.transaction(symbol, 2000000);
            z.then(data => {
              if (symbol == 'HPG') {
                // console.log(data)
              }
              stat.res++;
              ret[symbol] = data;
              if (data.data != undefined) {
                // {
                //   price: 10.75,
                //   change: 0.25,
                //   match_qtty: 5000,
                //   total_vol: 21338100,
                //   time: '14:29:14',
                //   side: 'sd'
                // }
                let f = [];
                from.forEach((v, i) => { f[i] = 0; })
                let first = [];
                let last = [];
                for (let p of data.data) {
                  let time = new Date(strdate + "T" + p.time);
                  from.forEach((v, i) => {
                    if (time >= v) {
                      if (f[i] == 0) {
                        first[i] = p;
                        f[i]++;
                      }
                      last[i] = p;
                    }
                  });
                }

                if (first.length > 0 && last.length > 0) {
                  let delta = first.map((v, i) => {
                    return ((v.change - last[i].change) * 100 / (v.price - v.change)).toFixed(2);
                  });
                  let change = first.map((v, i) => {
                    return ((v.change - last[i].change)).toFixed(2);
                  });

                  let e = {
                    symbol: symbol,
                    change: change,
                    'change%': (first.at(-1).change * 100 / (first.at(-1).price - first.at(-1).change)).toFixed(2),
                    price: first.at(-1).price,
                    vol: first.at(-1).total_vol,
                    deltaLast: delta.at(-1),
                    delta: delta,
                  };

                  t.forEach((v, i) => {
                    if (i >= 3) {
                      return;
                    }
                    e['delta' + t.at(i)] = delta.at(i) == undefined ? "" : delta.at(i);
                  });
                  if (symbol == 'BID') {
                    console.log(e, first, last)
                  }
                  table.push(e)
                }
              }

              if (stat.req == stat.res) {
                // console.log("Resolve", stat,table)
                resolve(table);
              }
            })
          }
        });


        promise.then(table => {
          // console.log("table", table[0])
          if (table == undefined || table.length == 0) {
            return;
          }
          var clitable = new CliTable3({ head: ['(Change1)', ...Object.keys(table[0])] })

          table = table.filter((e) => {
            return e.vol >= 150000;
          })
          table.sort((a, b) => {
            let x = a.delta.at(-1) - b.delta.at(-1);
            return x > 0 ? -1 : x < 0 ? 1 : 0;
          })
          let coloring = (e) => {
            let o = []
            let rt = e['%']
            let f = chalk.yellow;
            if (e.l == e.c) {
              f = chalk.magenta;
            } else if (e.l > e.r && e.l < e.c) {
              f = chalk.green;
            } else if (e.l == e.f) {
              f = chalk.blue;
            } else if (e.l < e.r && e.l > e.f) {
              f = chalk.red;
            }
            Object.keys(e).forEach((k, i) => {
              switch (k) {
                case '%':
                case 'tps':
                  o.push(f(e[k].toFixed(2)))
                  break;
                case 'time':
                  o.push(f(format(k, e[k])))
                  break;
                default:
                  o.push(f(e[k]));
              }
            });
            return o;
          }

          // console.log("table", table[0])
          table.slice(0, 15).forEach((e, i) => {
            clitable.push([i, ...coloring(e)]);
          })
          logger.info(clitable.toString())
          // let tb1 = clitable.toString();
          clitable = new CliTable3({ head: ['(Change2)', ...Object.keys(table[0])] })

          table.slice(Math.max(table.length - 15, 0), table.length).forEach((e, i) => {
            clitable.push([i, ...coloring(e)]);
          })
          logger.info(clitable.toString())
          // let tb2 = clitable.toString();

          // let a1 = tb1.split("\n");
          // let a2 = tb2.split("\n");
          // let z = a1.map((v, i) => {
          //   return v + "   " + a2[i] + "\n"
          // })
          // let c = z.reduce((a, b) => a + b, "");
          // console.log(c)

        });

      } catch (err) {
        logger.error(err)
      } finally {
        await wait(20000);
      }
    }
  }

  // asyncBatch();
  console.log("processData")
  processData();

})();

let symbolVal = Config.muaban()["symbolVal"]

async function processData() {
  let dir = "./trans/";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  // let __dirname = fs.realpathSync('.');

  // let allSymbols = await Exchange.vndGetAllSymbols();

  let symbolExchange = {};

  // allSymbols.forEach(v => {
  //   symbolExchange[v.code] = v.floor;
  // });

  let company = await Exchange.getlistallstock();


  company.forEach((e) => {
    if (e.stock_code.length <= 3) {
      symbolExchange[e.stock_code] = e.post_to;
    }
  })



  let listSymbol = await Exchange.getlistallsymbol();
  listSymbol = listSymbol.filter((s) => {
    return s.length <= 3;
  })
  let stockdata = {}
  // listSymbol= ['HPG']
  // console.log("getliststockdata",listSymbol)
  let z = Exchange.getliststockdata2(listSymbol, stockdata);
  await z;
  // console.log("sao the")
  // console.table(stockdata)
  // z.then(data=>console.log(data));

  let getAllFiles = (p, o) => {
    let files = fs.readdirSync(p);
    o = o || [];
    files.forEach((f) => {
      if (fs.statSync(p + "/" + f).isDirectory()) {
        getAllFiles(p + "/" + f, o);
      } else {
        o.push(path.join(p, "/", f));
      }
    })
  }



  // let files = fs.readdirSync(dir);
  let files = [];
  getAllFiles(dir, files);
  let mapFiles = {};
  let t = fs.readdirSync(dir);
  for (let p of t) {
    let p2 = dir + "/" + p;
    let pa = fs.readdirSync(p2);
    mapFiles[p] = pa.map(e => { return (p2 + "/" + e).replaceAll("//", "/") })
  }

  // console.log(mapFiles)
  // console.log(files.at(-1))
  // files.forEach((f) => {
  //   // console.log(f)
  //   try {
  //     processOne(f, symbolExchange)
  //   } catch (error) {
  //     console.log(f, error)
  //   }
  // // });

  var args = process.argv.slice(2);
  let vss = null;
  let update = "";
  let outlier = "";
  let model = "";
  let threshold = undefined;
  let interval = undefined;
  for (let v of args) {
    if (v.includes("date="))
      vss = v;

    if (v.includes("join="))
      update = v;

    if (v.includes("outlier="))
      outlier = v;
    if (v.includes("model="))
      model = v;
    if (v.includes("threshold="))
      threshold = v;

    if (v.includes("interval="))
      interval = v;
    // break;
    console.log(v)
  }
  if (update.toLocaleUpperCase().includes("TRUE")) {
    update = true;
  }
  if (outlier.toLocaleUpperCase().includes("TRUE")) {
    outlier = true;
  }
  if (model.toLocaleUpperCase().includes("TRUE")) {
    model = true;
  }

  if (threshold != undefined) {
    threshold = Number.parseFloat(threshold.substring("threshold=".length))
  }
  if (interval != undefined) {
    interval = Number.parseFloat(interval.substring("interval=".length))
  } else {
    interval = 5 * 60 * 1000;
  }
  console.log("threshold=", threshold)
  console.log("interval=", interval)

  let options = { update: update, outlier: outlier, model: model, threshold: threshold, interval: interval }
  let ss = vss == null ? [] : vss.substring("date=".length).split(",");

  let dateKeys;

  if (ss.length == 0) {
    dateKeys = Object.keys(mapFiles);
  } else {
    dateKeys = [...ss];
  }
  // let dateKeys = ['20230203','20230202','20230201','20230131','20230130']//
  // let dateKeys = Object.keys(mapFiles);
  let datekey;
  let p = { req: 0, res: 0 }
  let dataModel = {}

  if (fs.existsSync(dataModelPath + interval + "dataModel.json")) {
    let jsonData = fs.readFileSync(dataModelPath + interval + "dataModel.json")
    dataModel = JSON.parse(new String(jsonData));
    dataModel.loaded = true;
  }

  console.log("Starting..................")
  while ((datekey = dateKeys.pop()) != undefined) {
    console.log(datekey)

    files = mapFiles[datekey];
    p.req++;
    let out = {};
    let promise = new Promise((resolve, reject) => {
      let stat = { req: 0, res: 0 };
      let length = files.length;
      let hpg = files.filter(e => e.indexOf("BSR") > 0);
      // console.log(hpg)
      let hpgContent = fs.readFileSync(hpg[0], "utf-8");
      // console.log(hpgContent)
      let hpga = hpgContent.split("\n").map(e => e.split(","));
      let hout = hpga.map(e => e[0]).filter(e => (e + "").indexOf(".") > 0)

      let priceType = hout.length == 0 ? 1000 : 1;

      files.forEach(async (f) => {
        try {
          processOne(f, symbolExchange, out, stat, resolve, length, options, dataModel, priceType)
        } catch (error) {
          console.log(f, error)
        }
        // console.log(stat.req, stat.res)
        while (stat.req - stat.res >= 100) {
          await wait(10);
        }
      });
    })

    let strdate = datekey.slice(0, 4) + "-" + datekey.slice(4, 6) + "-" + datekey.slice(6);

    promise.then(res => {
      p.res++;
      // console.log(datekey, Object.keys(res),res)
      // {
      //   c: 9.59,
      //   h: 9.59,
      //   l: 9.59,
      //   o: 9.59,
      //   sd: 600,
      //   val_sd: 5754000,
      //   total_vol: 600,
      //   sum_vol: 600,
      //   val: 5754000,
      //   datetime: 1675329300000,
      //   date: '2023-02-02T09:15:00.000Z',
      //   pbu: 0,
      //   psd: 100,
      //   puk: 0,
      //   bs: 0,
      //   sb: Infinity,
      //   abu: 482.4,
      //   asd: 1282.4,
      //   auk: 70.6,
      //   rsd: 0.5
      // }      

      let newData = {}
      let max = { sd: [], bu: [] };
      let top = {};
      let oulier = []
      let summary = []
      let volgroup = []
      let dataAll = []
      let simpleDataAll = []
      let NganhDataAll = {}
      let pp = new Promise((resolve, reject) => {
        let length = Object.keys(res).length;
        // let res = 0; 
        let accum = 0;
        let uppct = Config.muaban()["uppct"]
        let toppct = Config.muaban()["toppct"]
        let downpct = Config.muaban()["downpct"]
        let enableDataAll = Config.muaban()["enableDataAll"]
        let dataField = Config.muaban()["DataField"]
        let nganhDataField = Config.muaban()["NganhDataField"]
        Object.keys(res).forEach((symbol, index) => {
          let symbolData = res[symbol];
          let count = 0;
          // console.table(symbolData.data.at(-1))
          let end = symbolData.data.at(-1);
          if (enableDataAll) {
            let sectorName = "";
            if (stockStore[symbol])
              sectorName = stockStore[symbol].SectorName;

            if (!NganhDataAll[sectorName]) NganhDataAll[sectorName] = {}

            symbolData.data.forEach((e, idx) => {
              let newEle = {}
              newEle.symbol = symbol
              newEle.Name = sectorName;
              let nganhEle = {}
              nganhEle["Name"] = sectorName;
              for (let kk of dataField) {
                if (e[kk]) {
                  newEle[kk] = e[kk]
                }
              }
              dataAll.push(newEle)
              if (idx == symbolData.data.length - 1) {
                simpleDataAll.push(newEle)
              }
              for (let kk of nganhDataField) {
                if (e[kk]) {
                  nganhEle[kk] = e[kk]
                }
              }
              if (!NganhDataAll[sectorName][nganhEle.datetime]) {
                NganhDataAll[sectorName][nganhEle.datetime] = nganhEle;
              }
              else {
                let t = NganhDataAll[sectorName][nganhEle.datetime];
                for (let kk in nganhEle) {
                  if (t[kk]) {
                    if (kk != 'datetime' && kk != 'date' && kk != 'Name')
                      t[kk] += nganhEle[kk]
                  }
                  else t[kk] = nganhEle[kk]
                }
              }
            })
          }
          if (end) {
            let p = stockdata[symbol]
            let add = {};
            let v = end;
            if (p != undefined) {
              add.c1 = p.lastPrice;
              add.pct1 = Math.floor((p.lastPrice - v.c) / v.c * 10000) / 100;
              add.pctc = Math.floor((p.lastPrice - v.c + v.change) / (v.c - v.change) * 10000) / 100;
              add.pctmeanc = Math.floor((p.lastPrice - v.meanc) / v.meanc * 10000) / 100;
              add["%maxc"] = Math.floor((v["maxc"] - p.lastPrice) / (p.lastPrice) * 10000) / 100;
              add["%minc"] = Math.floor((p.lastPrice - v["minc"]) / (p.lastPrice) * 10000) / 100;
              // console.log(add, p.lastPrice, v["maxc"], v["minc"], mul)
            }
            summary.push({ symbol: symbol, ...add, ...symbolData.data.at(-1) })
          }

          if (symbolData.floor == 'HOSE') {
            let x = symbolData.data;
            // console.log(symbol)
            // console.table(x)        
            x.forEach((v) => {
              let k = v.datetime;

              if (newData[k] == undefined) {
                newData[k] = { datetime: k };
              }
              let e = newData[k];
              let prop = ['sd', 'bu', 'uk', 'val_sd', 'val_bu', 'val_uk', 'sum_vol', 'val']

              prop.forEach(p => {
                let vv = ((v[p] == undefined) ? 0 : v[p]);
                e[p] = (e[p] == undefined) ? vv : e[p] + vv;
              })
              e.date = (new Date(k)).toISOString();
              count++;
              if (options.outlier) {
                if (v["Oval_bu"] > 0 || v["Oval_sd"] > 0 || v["pct"] >= uppct || v["pct"] <= downpct || v["pct"] >= toppct) {
                  // let BUSD = v["Oval_bu"] > 0 ? (v["Oval_sd"] > 0 ? "UKN" : "BU") : "SD"
                  let BUSD = v["val_bu"] > v["val_sd"] ? "BU" : "SD"
                  let p = stockdata[symbol]
                  let add = {};
                  if (p != undefined) {
                    add.c1 = p.lastPrice;
                    // if (v.c < 1000) v.c = v.c * 1000;
                    // if (p.lastPrice < 1000) p.lastPrice = p.lastPrice * 1000;
                    // if (v["maxc"] < 1000) v["maxc"] = v["maxc"] * 1000;
                    // if (v["minc"] < 1000) v["minc"] = v["minc"] * 1000;
                    add.pct1 = Math.floor((p.lastPrice - v.c) / v.c * 10000) / 100;
                    add.pctc = Math.floor((p.lastPrice - v.c + v.change) / (v.c - v.change) * 10000) / 100;
                    add.pctmeanc = Math.floor((p.lastPrice - v.meanc) / v.meanc * 10000) / 100;
                    add["%maxc"] = Math.floor((v["maxc"] - p.lastPrice) / (p.lastPrice) * 10000) / 100;
                    add["%minc"] = Math.floor((p.lastPrice - v["minc"]) / (p.lastPrice) * 10000) / 100;
                    // console.log(add, p.lastPrice, v["maxc"], v["minc"], mul)
                  }
                  oulier.push({ symbol: symbol, busd: BUSD, ...add, ...v })
                }
              }

            })

            let m = symbolData.max;
            m.sd.every(sd => {
              sd.symbol = symbol;
              max.sd.push(sd);
              return true;
            })

            m.bu.every(bu => {
              bu.symbol = symbol;
              max.bu.push(bu);
              return true;
            });

            let t = symbolData.top;
            Object.keys(t).forEach((k) => {
              let tk = t[k];
              tk.topbu.forEach(e => {
                e.vol = e.count * (+e.match_qtty)
                e.symbol = symbol;
                e.key = k;
              })
              tk.topsd.forEach(e => {
                e.vol = e.count * (+e.match_qtty)
                e.symbol = symbol;
                e.key = k;
              })
              tk.key = k;

              if (top[k] == undefined) top[k] = { ...tk };
              else {
                top[k].topbu.push(...tk.topbu)
                top[k].topsd.push(...tk.topsd)
              }
            });

          } else {
            let x = symbolData.data;
            x.forEach((v) => {
              let k = v.datetime;

              if (newData[k] == undefined) {
                newData[k] = { datetime: k };
              }
              let e = newData[k];
              let prop = ['sd', 'bu', 'uk', 'val_sd', 'val_bu', 'val_uk', 'sum_vol', 'val']

              prop.forEach(p => {
                let vv = ((v[p] == undefined) ? 0 : v[p]);
                e[p] = (e[p] == undefined) ? vv : e[p] + vv;
              })
              e.date = (new Date(k)).toISOString();
              count++;
              if (options.outlier) {
                if (v["Oval_bu"] > 0 || v["Oval_sd"] > 0 || v["pct"] >= uppct || v["pct"] <= downpct || v["pct"] >= toppct) {
                  // let BUSD = v["Oval_bu"] > 0 ? (v["Oval_sd"] > 0 ? "UKN" : "BU") : "SD"
                  let BUSD = v["val_bu"] > v["val_sd"] ? "BU" : "SD"
                  let p = stockdata[symbol]
                  let add = {};
                  if (p != undefined) {
                    add.c1 = p.lastPrice;
                    // if (v.c < 1000) v.c = v.c * 1000;
                    // if (p.lastPrice < 1000) p.lastPrice = p.lastPrice * 1000;
                    // if (v["maxc"] < 1000) v["maxc"] = v["maxc"] * 1000;
                    // if (v["minc"] < 1000) v["minc"] = v["minc"] * 1000;
                    add.pct1 = Math.floor((p.lastPrice - v.c) / v.c * 10000) / 100;
                    add.pctc = Math.floor((p.lastPrice - v.c + v.change) / (v.c - v.change) * 10000) / 100;
                    add.pctmeanc = Math.floor((p.lastPrice - v.meanc) / v.meanc * 10000) / 100;
                    add["%maxc"] = Math.floor((v["maxc"] - p.lastPrice) / (p.lastPrice) * 10000) / 100;
                    add["%minc"] = Math.floor((p.lastPrice - v["minc"]) / (p.lastPrice) * 10000) / 100;
                  }
                  oulier.push({ symbol: symbol, busd: BUSD, ...add, ...v })
                }
              }

            })
          }
          // console.log(index,length,symbolData.floor,x.length,count)
          //
          let prices = symbolData.prices;
          // console.table(Object.values(prices))
          Object.keys(prices).forEach(ke => {
            let z = { symbol: symbol, price: ke, ...prices[ke] };
            prices[ke] = z;
          })

          let vg = Object.values(prices);
          vg.sort((a, b) => { return a.price - b.price })
          volgroup.push(...vg);
          // console.table(Object.values(prices))
          //Ket thuc
          if (index + 1 == length) {
            // console.table(volgroup)
            let values = Object.values(newData);
            values.sort((a, b) => {
              let c = a.datetime - b.datetime;
              return c < 0 ? -1 : c > 0 ? 1 : 0
            })
            let accum_val = 0;
            let total_vol = 0;
            let acum_busd = 0;
            let acum_busd_val = 0;
            let acum_val_sd = 0;
            let acum_val_bu = 0;
            let accum_sd = 0;
            let accum_bu = 0;
            values.forEach(e => {
              accum_val += e.val == undefined ? 0 : e.val;
              acum_val_bu += e.val_bu == undefined ? 0 : e.val_bu;
              acum_val_sd += e.val_sd == undefined ? 0 : e.val_sd;
              accum_sd += e.sd == undefined ? 0 : e.sd;
              accum_bu += e.bu == undefined ? 0 : e.bu;
              total_vol += e.sum_vol == undefined ? 0 : e.sum_vol;
              acum_busd += e.bu - e.sd;
              acum_busd_val += e.val_bu - e.val_sd;
              e['acum_val'] = accum_val;
              e['total_vol'] = total_vol;
              e['bu-sd'] = e.bu - e.sd;
              e['bu-sd_val'] = e.val_bu - e.val_sd;
              e['acum_busd'] = acum_busd;
              e['acum_busd_val'] = acum_busd_val;
              e['acum_val_bu'] = acum_val_bu;
              e['acum_val_sd'] = acum_val_sd;
              e['accum_bu'] = accum_bu;
              e['accum_sd'] = accum_sd;
            })

            values.forEach(e => {
              e['avg_val_bu'] = Math.round(values.at(-1)['acum_val_bu'] / values.length * 10) / 10;
              e['avg_val_sd'] = Math.round(values.at(-1)['acum_val_sd'] / values.length * 10) / 10;
              e['avg_val'] = Math.round(values.at(-1)['acum_val'] / values.length * 10) / 10;
              e['avg_vol'] = Math.round(values.at(-1)['total_vol'] / values.length * 10) / 10;
              e['avg_bu'] = Math.round(values.at(-1)['accum_bu'] / values.length * 10) / 10;
              e['avg_sd'] = Math.round(values.at(-1)['accum_sd'] / values.length * 10) / 10;
              e['avg_busd'] = Math.round(values.at(-1)['acum_busd'] / values.length * 10) / 10;
              e['avg_busd_val'] = Math.round(values.at(-1)['acum_busd_val'] / values.length * 10) / 10;
              e['rbusd'] = Math.round(e['bu-sd_val'] / e['avg_busd_val'] * 10) / 10;
              e['rbu'] = Math.round(e['val_bu'] / e['avg_val_bu'] * 10) / 10;
              e['rsd'] = Math.round(e['val_sd'] / e['avg_val_sd'] * 10) / 10;
              e['bs'] = Math.round(e['bu'] / e['sd'] * 10) / 10;
              e['sb'] = Math.round(e['sd'] / e['bu'] * 10) / 10;
            })
            let val = Object.values(newData).map(e => e.val).reduce((a, b) => a + b, 0);
            let vol = Object.values(newData).map(e => e.sum_vol).reduce((a, b) => a + b, 0);
            // console.log(val, vol)
            // console.table(values)



            let dir = "./vnindex/" + datekey + "/";
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            } else {
              let files = fs.readdirSync(dir);
              for (const file of files) {
                fs.unlinkSync(path.join(dir, file));
              }
            }
            // console.table(str)
            let floor = "HOSE";

            // let session = options.session;
            let session = Config.muaban()["session"];
            if (session == undefined) session = 20;

            if (!sessionData.includes(session)) sessionData.push(session);

            if (options.outlier) {

              let out = [...values];
              out = out.reverse();

              let key = ['c', 'h', 'l', 'o', 'bu', 'val_bu', 'total_vol',
                'sum_vol', 'val', 'acum_val', 'sd', 'val_sd', 'pbu', 'psd',
                'puk', 'bs', 'sb', 'abu', 'asd', 'auk', 'rsd', 'rbu', 'bu-sd',
                'bu-sd_val', 'acum_busd', 'acum_busd_val', 'acum_val_bu',
                'acum_val_sd', 'rbusd', 'uk', 'val_uk', 'ruk'
              ];
              let check = (val) => {
                if (val == undefined || Number.isNaN(val)) {
                  return 0;
                }
                return val;
              }

              if (dataModel.loaded == undefined) {
                if (fs.existsSync("./vnindex/" + "VNINDEX" + "_" + floor + interval + ".json")) {
                  let jsonData = fs.readFileSync("./vnindex/" + "VNINDEX" + "_" + floor + interval + ".json")
                  let json = new String(jsonData).toString().split("\n").map(e => {
                    if (e.length > 0) {
                      return JSON.parse(e)
                    } else return []

                  });
                  json.forEach(e => {
                    out.push(...e.reverse());
                  })
                }

                out = out.filter(e => e.datetime >= fromDate.getTime());

                // let outs = out.slice(0, session);
                let dataOut = sessionData.map(e => {
                  let today = new Date(strdate);
                  let xDayAgo = new Date(today);
                  xDayAgo.setDate(today.getDate() - e);
                  return out.filter(e => e.datetime >= xDayAgo.getTime());
                })
                let outa = {};

                sessionData.forEach((ss, i) => {
                  // console.log(dataOut)
                  let outs = dataOut[i];
                  // if (outs.length == 0) return;
                  key.forEach(k => {
                    outa[k] = outs.map(e => check(e[k]));
                    let mean = stats.mean(outa[k])
                    let std = stats.stdev(outa[k])
                    let max = Math.max(...outa[k])
                    let min = Math.min(...outa[k])


                    if (options.model) {
                      if (dataModel[ss] == undefined) dataModel[ss] = {};
                      if (dataModel[ss]["VNINDEX"] == undefined) dataModel[ss]["VNINDEX"] = {};
                      dataModel[ss]["VNINDEX"]["mean" + k] = Math.floor(mean * 10000) / 10000;
                      dataModel[ss]["VNINDEX"]["std" + k] = Math.floor(std * 10000) / 10000;
                      dataModel[ss]["VNINDEX"]["max" + k] = max;
                      dataModel[ss]["VNINDEX"]["min" + k] = min;
                    }

                    if (ss == session) {
                      // let threshold = options.threshold;
                      let threshold = Config.muaban()["StdThreshold"];
                      if (threshold == undefined) threshold = 1.645;
                      for (let e of values) {
                        e["mean" + k] = Math.floor(mean * 100) / 100;
                        e["std" + k] = Math.floor(std * 100) / 100;
                        e["O" + k] = Math.floor((Math.abs(mean - check(e[k])) - threshold * std) * 100) / 100;
                        e["ORR" + k] = Math.floor((Math.abs(mean - check(e[k])) / std) * 100) / 100;
                        e["R" + k] = Math.floor((Math.abs(check(e[k]) / mean)) * 100) / 100;
                        let or = Math.floor((Math.abs(mean - check(e[k])) - threshold * std) / Math.abs(mean) * 100) / 100;
                        e["OR" + k] = Number.isNaN(or) ? Number.MIN_SAFE_INTEGER : or;
                        if (e["O" + k] > 0 || e["OR" + k] > 0) {
                          // console.table([e])
                        }
                      }
                    }

                  })



                  if (outa['c'] != undefined) {
                    const bb = { period: 20, stdDev: 2, values: outa['c'] };
                    var bbo = BollingerBands.calculate(bb);
                    let bbe = bbo.at(0);
                    values.forEach((e, i) => {
                      bbe = bbo.at(values.length - i);
                      if (bbe == undefined || bbe == null) {
                        // console.log(bbo.length, values.length, symbol)
                        return;
                      }
                      Object.keys(bbe).forEach(k => {
                        e["BB" + k] = bbe[k];
                        e["BBC" + k] = bbe[k] - e['c'];
                      })
                    })
                  }

                });

              } else {

                // let threshold = options.threshold;
                let threshold = Config.muaban()["StdThreshold"];
                if (threshold == undefined) threshold = 1.645;
                let mdd = dataModel[session]["VNINDEX"];
                key.forEach(k => {
                  let mean = mdd["mean" + k];
                  let std = mdd["std" + k];
                  for (let e of values) {
                    e["mean" + k] = Math.floor(mean * 100) / 100;
                    e["std" + k] = Math.floor(std * 100) / 100;
                    e["O" + k] = Math.floor((Math.abs(mean - check(e[k])) - threshold * std) * 100) / 100;
                    e["ORR" + k] = Math.floor((Math.abs(mean - check(e[k])) / std) * 100) / 100;
                    e["R" + k] = Math.floor((Math.abs(check(e[k]) / mean)) * 100) / 100;
                    let or = Math.floor((Math.abs(mean - check(e[k])) - threshold * std) / Math.abs(mean) * 100) / 100;
                    e["OR" + k] = Number.isNaN(or) ? Number.MIN_SAFE_INTEGER : or;
                    if (e["O" + k] > 0 || e["OR" + k] > 0) {
                      // console.table([e])
                    }
                  }
                })
              }






              // console.table([outa])
              // console.log(Object.keys(outs[0]))
              // console.table(outs.slice(0,10))
              // console.table(outs.slice(outs.length-10,outs.length-1))

              if (dataModel.loaded == undefined) {
                if (!fs.existsSync(dataModelPath)) fs.mkdirSync(dataModelPath, { recursive: true })
                fs.writeFileSync(dataModelPath + interval + "dataModel.json", JSON.stringify(dataModel), (e) => { if (e) { console.log(e) } })
                console.log("Save model ", dataModelPath + interval + "dataModel.json")
              }
              if (!fs.existsSync("./outlier/")) {
                fs.mkdirSync("./outlier/", { recursive: true })
              }

              oulier.forEach(e => {
                if (stockStore[e.symbol] != undefined)
                  e["Name"] = stockStore[e.symbol].SectorName;
              })

              oulier.sort((a, b) => { return b.datetime - a.datetime })
              // console.log(JSON.stringify(keys))
              let newOutlierBU = [];
              let newOutlierSD = [];
              let newOutlier = [];
              let priceUP = {};
              let priceDOWN = [];
              let topDOWN = [];
              let topUP = [];
              let fix = ['symbol', 'busd', 'Name', 'profit', 'pctmeanc', 'meanc', 'c1', 'pct1', 'pctc', 'pct', '%maxc', '%minc', 'Rval_bu', 'Rval_sd', 'c', 'change', 'h', 'l', 'o', 'bu', 'val_bu', 'sd', 'val_sd', 'total_vol', 'sum_vol', 'val', 'acum_val', 'datetime', 'date', 'ORRval_bu', 'ORval_bu', 'ORRval', 'Rval', 'ORval', 'ORRval_sd', 'ORval_sd', 'ORRval_uk', 'Rval_uk', 'ORval_uk', 'pbu', 'psd', 'puk', 'bs', 'sb', 'abu', 'asd', 'auk', 'rsd', 'bu-sd', 'bu-sd_val', 'avg_val_bu', 'avg_val_sd', 'acum_busd', 'acum_busd_val', 'acum_val_bu', 'acum_val_sd', 'rbusd', 'meanc', 'stdc', 'maxc', 'minc', 'Oc', 'ORRc', 'Rc', 'ORc', 'meanh', 'stdh', 'maxh', 'minh', 'Oh', 'ORRh', 'Rh', 'ORh', 'meanl', 'stdl', 'maxl', 'minl', 'Ol', 'ORRl', 'Rl', 'ORl', 'meano', 'stdo', 'maxo', 'mino', 'Oo', 'ORRo', 'Ro', 'ORo', 'meanbu', 'stdbu', 'maxbu', 'minbu', 'Obu', 'ORRbu', 'Rbu', 'ORbu', 'meanval_bu', 'stdval_bu', 'maxval_bu', 'minval_bu', 'Oval_bu', 'meantotal_vol', 'stdtotal_vol', 'maxtotal_vol', 'mintotal_vol', 'Ototal_vol', 'ORRtotal_vol', 'Rtotal_vol', 'ORtotal_vol', 'meansum_vol', 'stdsum_vol', 'maxsum_vol', 'minsum_vol', 'Osum_vol', 'ORRsum_vol', 'Rsum_vol', 'ORsum_vol', 'meanval', 'stdval', 'maxval', 'minval', 'Oval', 'meanacum_val', 'stdacum_val', 'maxacum_val', 'minacum_val', 'Oacum_val', 'ORRacum_val', 'Racum_val', 'ORacum_val', 'meansd', 'stdsd', 'maxsd', 'minsd', 'Osd', 'ORRsd', 'Rsd', 'ORsd', 'meanval_sd', 'stdval_sd', 'maxval_sd', 'minval_sd', 'Oval_sd', 'meanpbu', 'stdpbu', 'maxpbu', 'minpbu', 'Opbu', 'ORRpbu', 'Rpbu', 'ORpbu', 'meanpsd', 'stdpsd', 'maxpsd', 'minpsd', 'Opsd', 'ORRpsd', 'Rpsd', 'ORpsd', 'meanpuk', 'stdpuk', 'maxpuk', 'minpuk', 'Opuk', 'ORRpuk', 'Rpuk', 'ORpuk', 'meanbs', 'stdbs', 'maxbs', 'minbs', 'Obs', 'ORRbs', 'Rbs', 'ORbs', 'meansb', 'stdsb', 'maxsb', 'minsb', 'Osb', 'ORRsb', 'Rsb', 'ORsb', 'meanabu', 'stdabu', 'maxabu', 'minabu', 'Oabu', 'ORRabu', 'Rabu', 'ORabu', 'meanasd', 'stdasd', 'maxasd', 'minasd', 'Oasd', 'ORRasd', 'Rasd', 'ORasd', 'meanauk', 'stdauk', 'maxauk', 'minauk', 'Oauk', 'ORRauk', 'Rauk', 'ORauk', 'meanrsd', 'stdrsd', 'maxrsd', 'minrsd', 'Orsd', 'ORRrsd', 'Rrsd', 'ORrsd', 'meanrbu', 'stdrbu', 'maxrbu', 'minrbu', 'Orbu', 'ORRrbu', 'Rrbu', 'ORrbu', 'meanbu-sd', 'stdbu-sd', 'maxbu-sd', 'minbu-sd', 'Obu-sd', 'ORRbu-sd', 'Rbu-sd', 'ORbu-sd', 'meanbu-sd_val', 'stdbu-sd_val', 'maxbu-sd_val', 'minbu-sd_val', 'Obu-sd_val', 'ORRbu-sd_val', 'Rbu-sd_val', 'ORbu-sd_val', 'meanacum_busd', 'stdacum_busd', 'maxacum_busd', 'minacum_busd', 'Oacum_busd', 'ORRacum_busd', 'Racum_busd', 'ORacum_busd', 'meanacum_busd_val', 'stdacum_busd_val', 'maxacum_busd_val', 'minacum_busd_val', 'Oacum_busd_val', 'ORRacum_busd_val', 'Racum_busd_val', 'ORacum_busd_val', 'meanacum_val_bu', 'stdacum_val_bu', 'maxacum_val_bu', 'minacum_val_bu', 'Oacum_val_bu', 'ORRacum_val_bu', 'Racum_val_bu', 'ORacum_val_bu', 'meanacum_val_sd', 'stdacum_val_sd', 'maxacum_val_sd', 'minacum_val_sd', 'Oacum_val_sd', 'ORRacum_val_sd', 'Racum_val_sd', 'ORacum_val_sd', 'meanrbusd', 'stdrbusd', 'maxrbusd', 'minrbusd', 'Orbusd', 'ORRrbusd', 'Rrbusd', 'ORrbusd', 'meanuk', 'stduk', 'maxuk', 'minuk', 'Ouk', 'ORRuk', 'Ruk', 'ORuk', 'meanval_uk', 'stdval_uk', 'maxval_uk', 'minval_uk', 'Oval_uk', 'meanruk', 'stdruk', 'maxruk', 'minruk', 'Oruk', 'ORRruk', 'Rruk', 'ORruk', 'rbu', 'uk', 'val_uk', 'ruk']
              oulier.forEach(
                oe => {
                  let keys = Object.keys(oe);
                  keys = keys.filter(e => !fix.includes(e));
                  keys.sort();
                  keys = [...fix, ...keys];
                  let oen = {}
                  keys.forEach(e => oen[e] = oe[e]);
                  // console.log(oe.busd)
                  let threshold = Config.muaban()["OutlierThreshold"];

                  // if(oe["symbol"] == "FTS") {console.log(oe); console.log("---------------DK--------",(oe["Rval_bu"] >= threshold || oe["pct"] >= 2) && (oe.busd == 'BU' || oe.busd == 'UKN')) } 
                  // if (oe["symbol"] == "FTS") {
                  //   console.table(oe);
                  //   console.table([{
                  //     DK: (oe["Rval_bu"] >= threshold || oe["pct"] >= 2) && (oe.busd == 'BU' || oe.busd == 'UKN'),
                  //     Rval_bu: oe["Rval_bu"],
                  //     threshold: threshold,
                  //     pct: oe["pct"],
                  //     busd: oe.busd,
                  //     Oval_bu: oe["Oval_bu"],
                  //     Oval_sd: oe["Oval_sd"],
                  //     meanval_bu: oe["meanval_bu"],
                  //     meanval_sd: oe["meanval_sd"],
                  //     stdval_bu: oe["stdval_bu"],
                  //     stdval_sd: oe["stdval_sd"],
                  //     val_bu: oe["val_bu"],
                  //     val_sd: oe["val_sd"],
                  //   }
                  //   ])
                  // }
                  let profit = symbolVal[oen["symbol"]]
                  if (profit != undefined) {
                    oen["profit"] = profit;
                  }

                  if ((oe["Rval_bu"] >= threshold && oe["Oval_bu"] > 0) && (oe.busd == 'BU' || oe.busd == 'UKN'))
                    newOutlierBU.push(oen)
                  if (oe["Rval_sd"] >= threshold && oe["Oval_sd"] > 0 && oe.busd == 'SD')
                    newOutlierSD.push(oen)
                  if (oe["pct"] >= uppct) {
                    if (profit != undefined) {
                      priceUP[oen["symbol"]] = oen
                    }
                  }

                  if (oe["pctc"] >= toppct) {
                    topUP[oen["symbol"]] = oen
                  }
                  if (oe["pct"] <= downpct) {
                    if (profit != undefined) {
                      priceDOWN[oen["symbol"]] = oen
                    }
                  }
                  newOutlier.push(oen)
                }
              )
              priceUP = Object.values(priceUP).sort((a, b) => { return b.datetime - a.datetime })
              priceDOWN = Object.values(priceDOWN).sort((a, b) => { return b.datetime - a.datetime })
              let topUP_SORT = Object.values(topUP).sort((a, b) => { return b.pct - a.pct })
              topUP = [...topUP_SORT].sort((a, b) => { return b.datetime - a.datetime })
              let checkTop = {};
              let topShort = []

              topUP.forEach(e => {
                if (checkTop[e["symbol"]] == undefined) {
                  topShort.push(e)
                  checkTop[e["symbol"]] = e;
                }
              })

              let obj = {
                BU: newOutlierBU, BU_SORT: [...newOutlierBU].sort((a, b) => { return b["Rval_bu"] - a["Rval_bu"] }),
                SD: newOutlierSD, SD_SORT: [...newOutlierSD].sort((a, b) => { return b["Rval_sd"] - a["Rval_sd"] }),
                ALL: newOutlier,
                UP: priceUP, UP_SORT: [...priceUP].sort((a, b) => { return b["pct"] - a["pct"] }),
                DOWN: priceDOWN, DOWN_SORT: [...priceDOWN].sort((a, b) => { return a["pct"] - b["pct"] }),
                TOPUP_SORT: topUP_SORT,
                TOPUP: topUP,
                SHORTTOP: topShort
              }

              Object.keys(obj).forEach(busd => {
                let strtable = getTable(obj[busd]);
                // console.log(strtable)
                let as = strtable.split("\n");
                let header = as[2] + "\n" + as[1] + "\n" + as[2];
                let str = "";
                as.forEach((l, i) => {
                  str += l + "\n";
                  if (i > 3 && (i - 3) % 20 == 0) {
                    str += header + "\n";
                  }
                })
                fs.writeFileSync("./outlier/" + "VNINDEX" + "_" + floor + "_Outlier_" + datekey + "_" + busd + ".log", str, (e) => { if (e) { console.log(e) } })
              })


              writeArrayJson2Xlsx("./outlier/" + "VNINDEX" + "_" + floor + "_Outlier_" + datekey + ".xlsx", newOutlier)
            }

            summary.forEach(e => {
              let r = e.acum_val_bu / e.acum_val_sd;
              e.busd_end = Number.isNaN(r) ? -1 : Number.isFinite(r) ? r : 999999
              if (stockStore[e.symbol] != undefined)
                e["Name"] = stockStore[e.symbol].SectorName;
            })

            let fix = ['symbol', 'busd_end', 'Name', 'profit', 'pctmeanc', 'meanc', 'c1', 'pct1', 'pctc', 'pct', '%maxc', '%minc', 'Rval_bu', 'Rval_sd', 'c', 'change', 'h', 'l', 'o', 'bu', 'val_bu', 'sd', 'val_sd', 'total_vol', 'sum_vol', 'val', 'acum_val', 'datetime', 'date', 'ORRval_bu', 'ORval_bu', 'ORRval', 'Rval', 'ORval', 'ORRval_sd', 'ORval_sd', 'ORRval_uk', 'Rval_uk', 'ORval_uk', 'pbu', 'psd', 'puk', 'bs', 'sb', 'abu', 'asd', 'auk', 'rsd', 'bu-sd', 'bu-sd_val', 'avg_val_bu', 'avg_val_sd', 'acum_busd', 'acum_busd_val', 'acum_val_bu', 'acum_val_sd', 'rbusd', 'meanc', 'stdc', 'maxc', 'minc', 'Oc', 'ORRc', 'Rc', 'ORc', 'meanh', 'stdh', 'maxh', 'minh', 'Oh', 'ORRh', 'Rh', 'ORh', 'meanl', 'stdl', 'maxl', 'minl', 'Ol', 'ORRl', 'Rl', 'ORl', 'meano', 'stdo', 'maxo', 'mino', 'Oo', 'ORRo', 'Ro', 'ORo', 'meanbu', 'stdbu', 'maxbu', 'minbu', 'Obu', 'ORRbu', 'Rbu', 'ORbu', 'meanval_bu', 'stdval_bu', 'maxval_bu', 'minval_bu', 'Oval_bu', 'meantotal_vol', 'stdtotal_vol', 'maxtotal_vol', 'mintotal_vol', 'Ototal_vol', 'ORRtotal_vol', 'Rtotal_vol', 'ORtotal_vol', 'meansum_vol', 'stdsum_vol', 'maxsum_vol', 'minsum_vol', 'Osum_vol', 'ORRsum_vol', 'Rsum_vol', 'ORsum_vol', 'meanval', 'stdval', 'maxval', 'minval', 'Oval', 'meanacum_val', 'stdacum_val', 'maxacum_val', 'minacum_val', 'Oacum_val', 'ORRacum_val', 'Racum_val', 'ORacum_val', 'meansd', 'stdsd', 'maxsd', 'minsd', 'Osd', 'ORRsd', 'Rsd', 'ORsd', 'meanval_sd', 'stdval_sd', 'maxval_sd', 'minval_sd', 'Oval_sd', 'meanpbu', 'stdpbu', 'maxpbu', 'minpbu', 'Opbu', 'ORRpbu', 'Rpbu', 'ORpbu', 'meanpsd', 'stdpsd', 'maxpsd', 'minpsd', 'Opsd', 'ORRpsd', 'Rpsd', 'ORpsd', 'meanpuk', 'stdpuk', 'maxpuk', 'minpuk', 'Opuk', 'ORRpuk', 'Rpuk', 'ORpuk', 'meanbs', 'stdbs', 'maxbs', 'minbs', 'Obs', 'ORRbs', 'Rbs', 'ORbs', 'meansb', 'stdsb', 'maxsb', 'minsb', 'Osb', 'ORRsb', 'Rsb', 'ORsb', 'meanabu', 'stdabu', 'maxabu', 'minabu', 'Oabu', 'ORRabu', 'Rabu', 'ORabu', 'meanasd', 'stdasd', 'maxasd', 'minasd', 'Oasd', 'ORRasd', 'Rasd', 'ORasd', 'meanauk', 'stdauk', 'maxauk', 'minauk', 'Oauk', 'ORRauk', 'Rauk', 'ORauk', 'meanrsd', 'stdrsd', 'maxrsd', 'minrsd', 'Orsd', 'ORRrsd', 'Rrsd', 'ORrsd', 'meanrbu', 'stdrbu', 'maxrbu', 'minrbu', 'Orbu', 'ORRrbu', 'Rrbu', 'ORrbu', 'meanbu-sd', 'stdbu-sd', 'maxbu-sd', 'minbu-sd', 'Obu-sd', 'ORRbu-sd', 'Rbu-sd', 'ORbu-sd', 'meanbu-sd_val', 'stdbu-sd_val', 'maxbu-sd_val', 'minbu-sd_val', 'Obu-sd_val', 'ORRbu-sd_val', 'Rbu-sd_val', 'ORbu-sd_val', 'meanacum_busd', 'stdacum_busd', 'maxacum_busd', 'minacum_busd', 'Oacum_busd', 'ORRacum_busd', 'Racum_busd', 'ORacum_busd', 'meanacum_busd_val', 'stdacum_busd_val', 'maxacum_busd_val', 'minacum_busd_val', 'Oacum_busd_val', 'ORRacum_busd_val', 'Racum_busd_val', 'ORacum_busd_val', 'meanacum_val_bu', 'stdacum_val_bu', 'maxacum_val_bu', 'minacum_val_bu', 'Oacum_val_bu', 'ORRacum_val_bu', 'Racum_val_bu', 'ORacum_val_bu', 'meanacum_val_sd', 'stdacum_val_sd', 'maxacum_val_sd', 'minacum_val_sd', 'Oacum_val_sd', 'ORRacum_val_sd', 'Racum_val_sd', 'ORacum_val_sd', 'meanrbusd', 'stdrbusd', 'maxrbusd', 'minrbusd', 'Orbusd', 'ORRrbusd', 'Rrbusd', 'ORrbusd', 'meanuk', 'stduk', 'maxuk', 'minuk', 'Ouk', 'ORRuk', 'Ruk', 'ORuk', 'meanval_uk', 'stdval_uk', 'maxval_uk', 'minval_uk', 'Oval_uk', 'meanruk', 'stdruk', 'maxruk', 'minruk', 'Oruk', 'ORRruk', 'Rruk', 'ORruk', 'rbu', 'uk', 'val_uk', 'ruk']
            let nes = ['total_vol', 'acum_val', 'acum_busd', 'acum_busd_val', 'acum_val_bu', 'acum_val_sd', 'acum_vol_bu', 'acum_vol_sd']
            let newSummary = [];
            let nganh = {}
            let tt = { Name: 'total' }
            summary.forEach(
              oe => {
                let keys = Object.keys(oe);
                keys = keys.filter(e => !fix.includes(e));
                keys.sort();
                keys = [...fix, ...keys];
                let oen = {}
                keys.forEach(e => oen[e] = oe[e]);
                let profit = symbolVal[oen["symbol"]]
                if (profit != undefined) {
                  oen["profit"] = profit;
                }
                newSummary.push(oen)
                if (!nganh[oen.Name]) {
                  nganh[oen.Name] = { Name: oen.Name }
                }
                let ne = nganh[oen.Name];
                nes.forEach(e => {
                  ne[e] = ne[e] == undefined ? oen[e] : ne[e] + oen[e]
                  tt[e] = tt[e] == undefined ? oen[e] : tt[e] + oen[e]
                })
              });
            if (!nganh['total']) {
              nganh['total'] = tt;
            }

            Object.values(nganh).forEach(v => {
              nes.forEach(e => {
                v[e + "%"] = Math.floor(v[e] / tt[e] * 10000) / 100
              })
            })

            summary = newSummary;
            //write summary
            summary.sort((a, b) => {
              return b.busd_end - a.busd_end;
            })

            summary.forEach(e => {
              e["busdpval"] = Math.floor(e["acum_busd_val"] / e["acum_val"] * 10000) / 100
            })

            // console.table(nganh)

            let strtable = getTable(summary);
            let as = strtable.split("\n");
            let header = as[2] + "\n" + as[1] + "\n" + as[2];
            let str = "";
            as.forEach((l, i) => {
              str += l + "\n";
              if (i > 3 && (i - 3) % 20 == 0) {
                str += header + "\n";
              }
            })

            fs.writeFileSync("./outlier/" + "VNINDEX" + "_" + floor + "_Outlier_" + datekey + "_" + "busd" + ".log", str, (e) => { if (e) { console.log(e) } })
            fs.writeFileSync("./profile/busd.json", JSON.stringify(summary));
            fs.writeFileSync("./profile/busd_" + datekey + ".json", JSON.stringify(summary));
            writeArrayJson2Xlsx("./outlier/" + "VNINDEX" + "_" + floor + "_Outlier_BUSD_" + datekey + ".xlsx", summary)


            strtable = getTable(Object.values(nganh));
            as = strtable.split("\n");
            header = as[2] + "\n" + as[1] + "\n" + as[2];
            str = "";
            as.forEach((l, i) => {
              str += l + "\n";
              if (i > 3 && (i - 3) % 20 == 0) {
                str += header + "\n";
              }
            })

            fs.writeFileSync("./outlier/" + "Nganh" + "_" + "_Outlier_" + datekey + "_" + "busd" + ".log", str, (e) => { if (e) { console.log(e) } })
            writeArrayJson2Xlsx("./outlier/" + "Nganh" + "_" + "_Outlier_BUSD_" + datekey + ".xlsx", Object.values(nganh))

            strtable = getTable(values);
            as = strtable.split("\n");
            header = as[2] + "\n" + as[1] + "\n" + as[2];
            str = "";
            as.forEach((l, i) => {
              str += l + "\n";
              if (i > 3 && (i - 3) % 20 == 0) {
                str += header + "\n";
              }
            })

            writeArrayJson2Xlsx("./vnindex/" + "VNINDEX" + "_" + floor + "_Vol_Group_" + datekey + ".xlsx", volgroup)
            if (enableDataAll) {
              values.forEach((e, idx) => {
                let newEle = {}
                newEle.symbol = "VNINDEX"
                for (let kk of dataField) {
                  if (e[kk]) newEle[kk] = e[kk];
                }
                dataAll.push(newEle)
                if (idx == values.length - 1) {
                  simpleDataAll.push(newEle)
                }
              })
              let nganhDataAll2 = []
              for (let sn in NganhDataAll) {
                let Nganh = NganhDataAll[sn];
                // for(let dt in Nganh){
                //   let x = Nganh[dt];
                //   // x["Name"] = sn;
                //   nganhDataAll2.push(x);
                // }
                let total_vol = 0;
                let acum_val = 0;
                let acum_busd = 0;
                let acum_busd_val = 0;
                let acum_val_bu = 0;
                let acum_val_sd = 0;
                let acum_vol_bu = 0;
                let acum_vol_sd = 0;
                Object.keys(Nganh).sort().forEach(dt => {
                  let x = Nganh[dt];
                  if (x.sum_vol) total_vol += x.sum_vol;
                  if (x.val) acum_val += x.val;
                  if (x["bu-sd"]) acum_busd += x["bu-sd"];
                  if (x["bu-sd_val"]) acum_busd_val += x["bu-sd_val"]
                  if (x.val_bu) acum_val_bu += x.val_bu;
                  if (x.val_sd) acum_val_sd += x.val_sd;
                  if (x.bu) acum_vol_bu += x.bu;
                  if (x.sd) acum_vol_sd += x.sd;

                  x = {
                    ...x, total_vol: total_vol, acum_val: acum_val, acum_busd: acum_busd, acum_busd_val: acum_busd_val,
                    acum_val_bu: acum_val_bu, acum_val_sd: acum_val_sd, acum_vol_bu: acum_vol_bu, acum_vol_sd: acum_vol_sd
                  }
                  nganhDataAll2.push(x);
                })
              }
              writeArrayJson2Xlsx("./vnindex/" + "VNINDEX" + "_" + floor + "_Data_All_" + datekey + ".xlsx", dataAll)
              writeArrayJson2Xlsx("./vnindex/" + "VNINDEX" + "_" + floor + "_Nganh_Data_All_" + datekey + ".xlsx", nganhDataAll2)
              fs.writeFileSync("./data/" + "VNINDEX" + "_" + floor + "_Data_All_" + datekey + ".json", JSON.stringify(dataAll), (e) => { if (e) { console.log(e) } })
              fs.writeFileSync("./data/" + "VNINDEX" + "_" + floor + "_Simple_Data_All_" + datekey + ".json", JSON.stringify(simpleDataAll), (e) => { if (e) { console.log(e) } })
            }


            fs.writeFileSync("./data/" + "VNINDEX" + "_" + floor + "_Vol_Group_" + datekey + ".json", JSON.stringify(volgroup), (e) => { if (e) { console.log(e) } })


            fs.writeFileSync(dir + "VNINDEX" + "_" + floor + "_table.log", str, (e) => { if (e) { console.log(e) } })
            fs.writeFileSync(dir + "VNINDEX" + "_" + floor + "_5p.json", JSON.stringify(values), (e) => { if (e) { console.log(e) } })
            writeArrayJson2Xlsx(dir + "VNINDEX" + "_" + floor + "_5p_" + datekey + ".xlsx", values)
            if (options.update)
              fs.appendFileSync("./vnindex/" + "VNINDEX" + "_" + floor + interval + ".json", JSON.stringify(values) + "\n", (e) => { if (e) { console.log(e) } })
            // console.table(Object.keys(values[0]).sort())
            let csv = new Parser({ fields: ['acum_busd', 'acum_busd_val', "acum_val_bu", "acum_val_sd", 'acum_val', "accum_bu", "accum_sd", "avg_val_bu", "avg_val_sd", "avg_val", "avg_vol", "avg_bu", "avg_sd", "avg_busd", "avg_busd_val", "rbusd", 'rbu', 'rsd', 'bu', 'bu-sd', 'bu-sd_val', 'date', 'datetime', 'sd', 'sum_vol', 'total_vol', 'uk', 'val', 'val_bu', 'val_sd', 'val_uk'] });
            let data2 = csv.parse(values);
            fs.writeFileSync(dir + "VNINDEX" + "_" + floor + "_" + datekey + "_5phut.csv", data2 + "\n", (e) => { if (e) { console.log(e) } })

            //max
            max.bu.sort((a, b) => {
              let c = a.datetime - b.datetime;
              let x = +a.match_qtty - +b.match_qtty;
              return c < 0 ? -1 : c > 0 ? 1 : (x < 0 ? 1 : x > 0 ? -1 : 0);
            })

            max.sd.sort((a, b) => {
              let c = a.datetime - b.datetime;
              let x = +a.match_qtty - +b.match_qtty;
              return c < 0 ? -1 : c > 0 ? 1 : (x < 0 ? 1 : x > 0 ? -1 : 0);
            })
            // console.table(max.bu);
            function table(x) {
              let xstr = getTable(x);
              let xas = xstr.split("\n");
              let xheader = xas[2] + "\n" + xas[1] + "\n" + xas[2];
              let str = "";
              xas.forEach((l, i) => {
                str += l + "\n";
                if (i > 3 && (i - 3) % 20 == 0) {
                  str += xheader + "\n";
                }
              })
              return str;
            }
            writeArrayJson2Xlsx(dir + "VNINDEX" + "_" + floor + "_MAX_BU_" + datekey + ".xlsx", max.bu)
            writeArrayJson2Xlsx(dir + "VNINDEX" + "_" + floor + "_MAX_SD_" + datekey + ".xlsx", max.sd)

            // console.log(table(max.bu));
            // console.log(table(max.sd));
            let topValues = Object.values(top).sort((a, b) => {
              let c = a.key - b.key;
              return c < 0 ? -1 : c > 0 ? 1 : 0;
            })
            function sort(a, b) {
              let c = a.vol - b.vol;
              return c < 0 ? -1 : c > 0 ? 1 : 0;
            }
            let topbustr = "";
            let topsdstr = "";
            topValues.forEach(t => {
              t.topsd.sort(sort);
              t.topbu.sort(sort);
              topbustr += table(t.topbu) + "\n";
              topsdstr += table(t.topsd) + "\n";
            })

            fs.appendFileSync(dir + "VNINDEX" + "_" + floor + "_TOP_SD_" + datekey + "_table.log", topsdstr, (e) => { if (e) { console.log(e) } })
            fs.appendFileSync(dir + "VNINDEX" + "_" + floor + "_TOP_BU_" + datekey + "_table.log", topbustr, (e) => { if (e) { console.log(e) } })


            fs.writeFileSync(dir + "VNINDEX" + "_" + floor + "_MAX_SD_" + datekey + "_table.log", table(max.bu), (e) => { if (e) { console.log(e) } })
            fs.writeFileSync(dir + "VNINDEX" + "_" + floor + "_MAX_BU_" + datekey + "_table.log", table(max.bu), (e) => { if (e) { console.log(e) } })
          }
          delete res[symbol]
        })

      });

    });



    while (p.req - p.res >= 1) {
      await wait(100);
    }
  }
  // console.log(mapFiles)
  // processOne('./trans/20230206/HPG_trans.txt', { HPG: 'HOSE' }, {}, { req: 0, res: 0 }, (a) => { }, 1)
  // processOne('trans/20221207/AAA_trans.txt')
}



async function processOne(file, symbolExchange, out, stat, resolve, totalFile, options, dataModel, priceType) {
  // console.log(file)
  stat.req++;
  let maxTopInterval = 10;
  let maxTopAll = 50;
  let interval = options.interval;
  if (interval == undefined) interval = 5 * 60 * 1000;

  let data = fs.readFile(file, readHandler)
  let strdate0 = file.substr(file.indexOf("trans/") + "trans/".length, 8)
  let strdate = strdate0.slice(0, 4) + "-" + strdate0.slice(4, 6) + "-" + strdate0.slice(6);
  let symbol = file.substr(file.lastIndexOf("/") + 1, 3);
  function readHandler(err, buffer) {
    let data = buffer.toString("utf8")
      .split('\n')
      .map(e => e.trim())
      .map(e => e.split(',').map(e => e.trim()));
    let head = data[0];
    data = data.slice(1);
    data = data.map(e => {
      let x = {};
      for (let i = 0; i < head.length; i++) {
        if (e.length < head.length) {
          continue;
        }
        x[head[i].replaceAll("\"", "")] = e[i].replaceAll("\"", "");
        if (x.time != undefined) {
          x.datetime = (new Date(strdate + "T" + x.time)).getTime();
          if (x.datetime > (Date.now() + 7 * 60 * 60 * 1000)) {
            console.log(symbol, file, e)
          }
        }
      }
      return x;
    })
    data = data.reverse();
    data = data.slice(1);



    data.sort((a, b) => {
      let c = a.datetime - b.datetime;
      return c < 0 ? -1 : c > 0 ? 1 : 0
    })

    let newData = {};
    let accum = {};
    let max = { sd: [], bu: [] }
    let top = {};
    let minp = 99999999;
    let maxp = 0;
    let prices = {}
    let range = Config.muaban()["range"];
    data.forEach((v, i) => {
      // console.log(v)
      if (+v.price == 0) return;
      let k = Math.floor(v.datetime / interval) * interval;
      if (Number.isNaN(k)) {
        return;
      }
      if (newData[k] == undefined) {
        newData[k] = {};
      }

      if (top[k] == undefined) {
        top[k] = { topsd: [], topbu: [] }
      }
      let te = top[k];
      let e = newData[k];
      if (priceType == 1000) {
        v.price = (+v.price / 1000).toFixed(2);
        v.change = ((+v.change) / 1000).toFixed(2);
      }
      let p = +v.price;

      // if(p == 0) return;
      // if (!v.price.indexOf(".") > 0) {
      //   v.price = (p / 1000).toFixed(2)
      // }      
      // console.log(v)
      e.c = p;
      e.change = +v.change
      e.pct = Math.floor(e.change / (e.c - e.change) * 10000) / 100
      if (e.h == undefined) e.h = p
      if (e.l == undefined) e.l = p
      if (e.h < p) e.h = p;
      if (e.l > p) e.l = p;
      if (e.o == undefined) e.o = p;
      let short = true;
      // if (v.price.indexOf(".") > 0) {
      //   short = true;
      // }
      let val = short ? +v.match_qtty * p * 1000 : +v.match_qtty * p;
      let kk = ["bu", "sd", "unknown"]
      if (!prices[v.price]) {
        let m = { "bu": 0, "sd": 0, "unknown": 0 }
        kk.forEach(kke => {
          m[kke + "val"] = 0;
          m[kke + "-c"] = 0;
        })
        range.forEach(e => {
          kk.forEach(kke => {
            m[e + "-" + kke] = 0;
            m[e + "-" + kke + "-c"] = 0;
          })
        });
        prices[v.price] = m;
      }
      let m = prices[v.price];
      m[v.side] += +v.match_qtty;
      m[v.side + "val"] += val;
      m[v.side + "-c"] += 1;
      range.every(e => {
        if (+v.match_qtty <= e) {
          m[e + "-" + v.side] += +v.match_qtty;
          m[e + "-" + v.side + "-c"] += 1;
          return false;
        }
        return true;
      })


      switch (v.side) {
        case 'bu':
          e.bu = (e.bu == undefined) ? +v.match_qtty : e.bu + +v.match_qtty;
          e.val_bu = (e.val_bu == undefined) ? val : e.val_bu + val;
          // let bup = 'bu.' + Math.floor(e.pct * 10);
          // let vbup = 'val_bu.' + Math.floor(e.pct * 10);
          // e[bup] = (e[bup] == undefined) ? +v.match_qtty : e[bup] + +v.match_qtty;
          // e[vbup] = (e[vbup] == undefined) ? val : e[vbup] + val;
          if (max.bu.length == 0) { v.count = 1; max.bu.push(v); }
          else {
            max.bu.every((el, i) => {
              if (+v.match_qtty >= +el.match_qtty) {
                v.count = max.bu[i].count + 1;
                max.bu[i] = v;
                return false;
              } else {
                if (i + 1 == max.bu.length && i + 1 <= maxTopAll) {
                  v.count = 1;
                  max.bu.push(v);
                  return false;
                }
              }
              return true;
            });
          }

          if (te.topbu.length == 0) { let nn = { ...v }; nn.count = 1; te.topbu.push(nn) }
          else {
            te.topbu.every((el, i) => {
              if (+v.match_qtty >= +el.match_qtty) {
                let nn = { ...v };
                nn.count = te.topbu[i].count + 1;
                te.topbu[i] = nn;
                return false;
              } else {
                if (i + 1 == te.topbu.length && i + 1 <= maxTopInterval) {
                  let nn = { ...v }; nn.count = 1; te.topbu.push(nn)
                  return false;
                }
              }
              return true;
            });
          }
          break;
        case 'sd':
          e.sd = (e.sd == undefined) ? +v.match_qtty : e.sd + +v.match_qtty;
          e.val_sd = (e.val_sd == undefined) ? val : e.val_sd + val;
          // let sdp = 'sd.' + Math.floor(e.pct * 10);
          // let vsdp = 'val_sd.' + Math.floor(e.pct * 10);
          // e[sdp] = (e[sdp] == undefined) ? +v.match_qtty : e[sdp] + +v.match_qtty;
          // e[vsdp] = (e[vsdp] == undefined) ? val : e[vsdp] + val;
          if (max.sd.length == 0) { v.count = 1; max.sd.push(v); }
          else {
            max.sd.every((el, i) => {
              if (+v.match_qtty >= +el.match_qtty) {
                v.count = max.sd[i].count + 1;
                max.sd[i] = v;
                return false;
              } else {
                if (i + 1 == max.sd.length && i + 1 <= maxTopAll) {
                  v.count = 1;
                  max.sd.push(v);
                  return false;
                }
              }
              return true;
            });
          }

          if (te.topsd.length == 0) { let nn = { ...v }; nn.count = 1; te.topsd.push(nn) }
          else {
            te.topsd.every((el, i) => {
              if (+v.match_qtty >= +el.match_qtty) {
                let nn = { ...v };
                nn.count = te.topsd[i].count + 1;
                te.topsd[i] = nn;
                return false;
              } else {
                if (i + 1 == te.topsd.length && i + 1 <= maxTopInterval) {
                  let nn = { ...v }; nn.count = 1; te.topsd.push(nn)
                  return false;
                }
              }
              return true;
            });
          }
          break;
        default:
          e.uk = (e.uk == undefined) ? +v.match_qtty : e.uk + +v.match_qtty;
          e.val_uk = (e.val_uk == undefined) ? val : e.val_uk + val;
        // let ukp = 'uk.' + Math.floor(e.pct * 10);
        // let vukp = 'val_uk.' + Math.floor(e.pct * 10);
        // e[ukp] = (e[ukp] == undefined) ? +v.match_qtty : e[ukp] + +v.match_qtty;
        // e[vukp] = (e[vukp] == undefined) ? val : e[vukp] + val;
      }
      e.total_vol = +v.total_vol;
      e.sum_vol = (e.sum_vol == undefined) ? +v.match_qtty : e.sum_vol + +v.match_qtty
      e.val = (e.val == undefined) ? val : e.val + val;
      accum.acum_val = (accum.acum_val == undefined) ? val : accum.acum_val + val;
      e.acum_val = accum.acum_val;

      if (!accum.first) {
        accum.first = +v.match_qtty;
        accum.firstside = v.side;
        accum.firstval = val;
      }

      accum.last = +v.match_qtty;
      accum.lastside = v.side;
      accum.lasttval = val;

      // "price","change","match_qtty","side","time","total_vol"
      // 7.6,-0.39,371100,"unknown","14:45:01",3774200
      // 7.61,-0.38,3000,"sd","14:30:10",3403100
      // 7.61,-0.38,1000,"sd","14:29:59",3400100

    });




    let avg = Object.values(newData).reduce((a, b) => {
      return {
        uk: (a.uk == undefined ? 0 : a.uk) + (b.uk == undefined ? 0 : b.uk),
        bu: (a.bu == undefined ? 0 : a.bu) + (b.bu == undefined ? 0 : b.bu),
        sd: (a.sd == undefined ? 0 : a.sd) + (b.sd == undefined ? 0 : b.sd),
        sum_vol: (a.sum_vol == undefined ? 0 : a.sum_vol) + (b.sum_vol == undefined ? 0 : b.sum_vol),
        val_bu: (a.val_bu == undefined ? 0 : a.val_bu) + (b.val_bu == undefined ? 0 : b.val_bu),
        val_sd: (a.val_sd == undefined ? 0 : a.val_sd) + (b.val_sd == undefined ? 0 : b.val_sd),
      }
    }, { uk: 0, bu: 0, sd: 0, sum_vol: 0, val_bu: 0, val_sd: 0 })

    let length = Object.values(newData).length;
    // console.log(avg, file)
    let busdkeys = {}
    let x = Object.keys(newData).map(k => {
      let e = newData[k];
      // console.log(k,e)
      e.datetime = +k;
      e.date = (new Date(+k)).toISOString();
      let uk = (e.uk == undefined ? 0 : e.uk);
      let bu = (e.bu == undefined ? 0 : e.bu);
      let sd = (e.sd == undefined ? 0 : e.sd);
      let t = uk + bu + sd;
      e.pbu = Math.round(bu / t * 1000) / 10
      e.psd = Math.round(sd / t * 1000) / 10
      e.puk = Math.round(uk / t * 1000) / 10
      e.bs = Math.round(bu / sd * 10) / 10
      e.sb = Math.round(sd / bu * 10) / 10
      e.abu = Math.round(avg.bu / length * 10) / 10;
      e.asd = Math.round(avg.sd / length * 10) / 10;
      e.auk = Math.round(avg.uk / length * 10) / 10;
      if (e.uk != undefined) e.ruk = Math.round(e.uk / e.auk * 10) / 10;
      if (e.sd != undefined) e.rsd = Math.round(e.sd / e.asd * 10) / 10;
      if (e.bu != undefined) e.rbu = Math.round(e.bu / e.abu * 10) / 10;
      let val_sd = ((e.val_sd == undefined) ? 0 : e.val_sd);
      let val_bu = ((e.val_bu == undefined) ? 0 : e.val_bu);
      e['bu-sd'] = bu - sd;
      e['bu-sd_val'] = val_bu - val_sd;
      e['avg_val_bu'] = Math.round(avg.val_bu / length * 10) / 10;
      e['avg_val_sd'] = Math.round(avg.val_sd / length * 10) / 10;
      // Object.keys(e).forEach(kk => {
      //   if (kk.includes("bu.") || kk.includes("sd.") || kk.includes("uk.")) {
      //     busdkeys[kk] = ''
      //   }
      // })
      return e
    })
    // console.table(busdkeys)
    if (x.length == 0) {
      stat.res++;
      if (stat.res == totalFile) {
        console.log(stat, totalFile)
        resolve(out)
      }
      return;
    }
    x.sort((a, b) => {
      let c = a.datetime - b.datetime;
      return c < 0 ? -1 : c > 0 ? 1 : 0
    })
    let xcum = accum;
    accum = {};
    let ackeys = {};
    x.forEach(e => {
      accum.acum_busd = (accum.acum_busd == undefined) ? e['bu-sd'] : accum.acum_busd + e['bu-sd'];
      accum.acum_busd_val = (accum.acum_busd_val == undefined) ? e['bu-sd_val'] : accum.acum_busd_val + e['bu-sd_val'];
      accum.acum_val_bu = (accum.acum_val_bu == undefined) ? (e['val_bu'] == undefined) ? 0 : e['val_bu'] : accum.acum_val_bu + ((e['val_bu'] == undefined) ? 0 : e['val_bu'])
      accum.acum_val_sd = (accum.acum_val_sd == undefined) ? (e['val_sd'] == undefined) ? 0 : e['val_sd'] : accum.acum_val_sd + ((e['val_sd'] == undefined) ? 0 : e['val_sd']);
      accum.acum_vol_bu = (accum.acum_vol_bu == undefined) ? (e['bu'] == undefined) ? 0 : e['bu'] : accum.acum_vol_bu + ((e['bu'] == undefined) ? 0 : e['bu'])
      accum.acum_vol_sd = (accum.acum_vol_sd == undefined) ? (e['sd'] == undefined) ? 0 : e['sd'] : accum.acum_vol_sd + ((e['sd'] == undefined) ? 0 : e['sd'])
      e['acum_busd'] = accum.acum_busd;
      e['acum_busd_val'] = accum.acum_busd_val;
      e['acum_val_bu'] = accum.acum_val_bu;
      e['acum_val_sd'] = accum.acum_val_sd;
      e['acum_vol_bu'] = accum.acum_vol_bu;
      e['acum_vol_sd'] = accum.acum_vol_sd;

      e.first = xcum.first
      e.firstside = xcum.firstside
      e.firstVal = xcum.firstVal
      e.last = xcum.last
      e.lastside = xcum.lastside
      e.lastVal = xcum.lastVal


      // Object.keys(busdkeys).forEach(kk => {
      //   let ac = 'acum_' + kk;
      //   let vkk = e[kk] == undefined ? 0 : e[kk];
      //   accum[ac] = (accum[ac] == undefined) ? vkk : accum[ac] + vkk;
      //   e[ac] = accum[ac]
      //   ackeys[ac] = ''
      // })
    })

    x.forEach(e => {
      e.rbusd = Math.round(e['bu-sd_val'] / (x.at(-1).acum_busd_val / x.length) * 10) / 10
    })
    let strtable = getTable(x);
    let as = strtable.split("\n");
    let header = as[2] + "\n" + as[1] + "\n" + as[2];
    let str = "";
    as.forEach((l, i) => {
      str += l + "\n";
      if (i > 3 && (i - 3) % 20 == 0) {
        str += header + "\n";
      }
    })

    // console.table(x)

    function sort(a, b) {
      let c = a.datetime - b.datetime;
      return c < 0 ? -1 : c > 0 ? 1 : 0
    };
    // Object.values(top).map(e => { console.table(e.topsd.sort(sort)); console.table(e.topbu.sort(sort)); })
    // if (logger.isDebugEnabled)
    // logger.debug(data[0], data.at(-1));
    // console.table(symbol)





    let dir = "./agg/" + strdate0 + "/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let dirAll = "./agg/all/";
    if (!fs.existsSync(dirAll)) {
      fs.mkdirSync(dirAll, { recursive: true });
    }


    let floor = symbolExchange[symbol];
    if (floor == undefined) floor = "UKN";

    // console.log(floor)
    // let session = options.session;
    let session = Config.muaban()["session"]
    if (session == undefined) session = 20;
    // if (symbol == "CEO") {
    // console.table(x)
    // }
    if (options.outlier) {
      let out = [...x];
      out = out.reverse();

      let key = ['c', 'h', 'l', 'o', 'bu', 'val_bu', 'total_vol',
        'sum_vol', 'val', 'acum_val', 'sd', 'val_sd', 'pbu', 'psd',
        'puk', 'bs', 'sb', 'abu', 'asd', 'auk', 'rsd', 'rbu', 'bu-sd',
        'bu-sd_val', 'acum_busd', 'acum_busd_val', 'acum_val_bu',
        'acum_val_sd', 'rbusd', 'uk', 'val_uk', 'ruk'
      ];

      let check = (val) => {
        if (val == undefined || Number.isNaN(val)) {
          return 0;
        }
        return val;
      }

      let sumField = Config.muaban()["sumField"];
      // console.log(session,symbol,Object.keys(dataModel))
      if (dataModel.loaded == undefined || dataModel[session][symbol] == undefined) {

        // console.log(dirAll + symbol + "_" + floor + interval + ".json", fs.existsSync(dirAll + symbol + "_" + floor + interval + ".json"))
        if (fs.existsSync(dirAll + symbol + "_" + floor + interval + ".json")) {
          let jsonData = fs.readFileSync(dirAll + symbol + "_" + floor + interval + ".json")
          let json = new String(jsonData).toString().split("\n").map(e => {
            if (e.length > 0) {
              return JSON.parse(e)
            } else return []

          });
          json.forEach(e => {
            out.push(...e.reverse());
          })
        }

        out = out.filter(e => e.datetime >= fromDate.getTime())
        // let dataOut = sessionData.map(e => out.slice(0, e))
        let dataOut = sessionData.map(e => {
          let today = new Date(strdate);
          // let xDayAgo = new Date(today);
          let xDayAgo = new Date(today);
          xDayAgo.setDate(today.getDate() - e);
          return out.filter(e => e.datetime >= xDayAgo.getTime());
        })
        let outa = {};
        sessionData.forEach(
          (ss, i) => {
            let outs = dataOut[i];
            // if (outs.length == 0) return;
            key.forEach(k => {
              outa[k] = outs.map(e => check(e[k]));
              let mean = stats.mean(outa[k])
              let std = stats.stdev(outa[k])
              let max = Math.max(...outa[k])
              let min = Math.min(...outa[k])
              let includes = sumField.includes(k);
              let sum = 0;
              if (includes) {
                sum = outa[k].reduce((a, b) => a + b, 0)
              }

              if (symbol == "CEO") {
                // console.log("max" +k, max, "min" +k, min)
                // console.table(outa)
                // console.table(out.slice(0, ss))
              }

              if (options.model) {
                if (dataModel[ss] == undefined) dataModel[ss] = {};
                if (dataModel[ss][symbol] == undefined) dataModel[ss][symbol] = {};
                dataModel[ss][symbol]["mean" + k] = Math.floor(mean * 10000) / 10000;
                dataModel[ss][symbol]["std" + k] = Math.floor(std * 10000) / 10000;
                dataModel[ss][symbol]["max" + k] = max;
                dataModel[ss][symbol]["min" + k] = min;
                if (includes) {
                  dataModel[ss][symbol]["sum" + k] = sum;
                }
              }
              if (ss == session) {
                // let threshold = options.threshold;
                let threshold = Config.muaban()["StdThreshold"];
                if (threshold == undefined) threshold = 1.645;
                for (let e of x) {
                  e["mean" + k] = Math.floor(mean * 100) / 100;
                  e["std" + k] = Math.floor(std * 100) / 100;
                  e["max" + k] = max;
                  e["min" + k] = min;
                  e["O" + k] = Math.floor((Math.abs(mean - check(e[k])) - threshold * std) * 100) / 100;
                  e["ORR" + k] = Math.floor((Math.abs(mean - check(e[k])) / std) * 100) / 100;
                  e["R" + k] = Math.floor((Math.abs(check(e[k]) / mean)) * 100) / 100;
                  // console.log("ORR")
                  let or = Math.floor((Math.abs(mean - check(e[k])) - threshold * std) / Math.abs(mean) * 100) / 100;
                  e["OR" + k] = Number.isNaN(or) ? Number.MIN_SAFE_INTEGER : or;
                  if (e["O" + k] > 0 || e["OR" + k] > 0) {
                    // console.table([e])
                  }
                  // if(includes){
                  //   dataModel[ss][symbol]["sum" + k] = sum;
                  // }                  
                }
              }
            })
          }
        )

        if (outa['c'] != undefined) {
          // console.log(symbol, outa['c'])


          const bb = { period: 20, stdDev: 2, values: outa['c'] };

          var bbo = BollingerBands.calculate(bb);
          // console.log(symbol, bbo.at(0), bbo.at(-1))
          let bbe = bbo.at(0);
          x.forEach((e, i) => {
            bbe = bbo.at(x.length - i);
            if (bbe == undefined || bbe == null) {
              // console.log(bbo.length, x.length, symbol)
              return;
            }
            Object.keys(bbe).forEach(k => {
              e["BB" + k] = bbe[k];
              e["BBC" + k] = bbe[k] - e['c'];
            })
          })
        }
        // dataModel[session][symbol]['BBData'] = outa['c'].slice(0, Math.min(40, outa['c'].length));

      } else {

        // let threshold = options.threshold;
        let threshold = Config.muaban()["StdThreshold"];
        if (threshold == undefined) threshold = 1.645;

        let mdd = dataModel[session][symbol];
        // console.table(symbol)
        // console.table(mdd)




        key.forEach(k => {
          let mean = mdd["mean" + k];
          let std = mdd["std" + k];
          let sum = 0;
          let includes = sumField.includes(k);
          if (includes) {
            let outk = out.map(e => check(e[k]));
            sum = outk.reduce((a, b) => a + b, 0)
          }
          for (let e of x) {
            e["mean" + k] = Math.floor(mean * 100) / 100;
            e["std" + k] = Math.floor(std * 100) / 100;
            e["max" + k] = mdd["max" + k];
            e["min" + k] = mdd["min" + k];
            e["O" + k] = Math.floor((Math.abs(mean - check(e[k])) - threshold * std) * 100) / 100;
            e["ORR" + k] = Math.floor((Math.abs(mean - check(e[k])) / std) * 100) / 100;
            e["R" + k] = Math.floor((Math.abs(check(e[k]) / mean)) * 100) / 100;
            let or = Math.floor((Math.abs(mean - check(e[k])) - threshold * std) / Math.abs(mean) * 100) / 100;
            e["OR" + k] = Number.isNaN(or) ? Number.MIN_SAFE_INTEGER : or;
            if (e["O" + k] > 0 || e["OR" + k] > 0) {
              // console.table([e])
            }
          }
        })

      }
    }

    fs.writeFileSync(dir + symbol + "_" + floor + "_table.log", str, (e) => { if (e) { console.log(e) } })
    fs.writeFileSync(dir + symbol + "_" + floor + "_5p.json", JSON.stringify(x), (e) => { if (e) { console.log(e) } })
    if (options.update)
      fs.appendFileSync(dirAll + symbol + "_" + floor + interval + ".json", JSON.stringify(x) + "\n", (e) => { if (e) { console.log(e) } })
    let enableWriteXlsxSymbol = Config.muaban()["enableWriteXlsxSymbol"]
    if (enableWriteXlsxSymbol)
      writeArrayJson2Xlsx(dir + symbol + "_" + floor + "_" + strdate0 + "_1N.xls", x)
    // console.table(ackeys)      
    // let csv = new Parser({ fields: ["abu", "acum_busd", "acum_busd_val", "acum_val_bu", "acum_val_sd", "acum_val", "avg_val_bu", "avg_val_sd", "rbusd", "asd", "auk", "bs", "bu", "bu-sd", "bu-sd_val", "c", "date", "datetime", "h", "l", "o", "pbu", "psd", "puk", "rbu", "rsd", "ruk", "sb", "sd", "sum_vol", "total_vol", "uk", "val", "val_bu", "val_sd", "val_uk", ...Object.keys(busdkeys), ...Object.keys(ackeys)] });
    let csv = new Parser({ fields: ["abu", "acum_busd", "acum_busd_val", "acum_val_bu", "acum_val_sd", "acum_val", "avg_val_bu", "avg_val_sd", "rbusd", "asd", "auk", "bs", "bu", "bu-sd", "bu-sd_val", "c", "date", "datetime", "h", "l", "o", "pbu", "psd", "puk", "rbu", "rsd", "ruk", "sb", "sd", "sum_vol", "total_vol", "uk", "val", "val_bu", "val_sd", "val_uk"] });
    let data2 = csv.parse(x);
    fs.writeFileSync(dir + symbol + "_" + floor + "_1N.csv", data2 + "\n", (e) => { if (e) { console.log(e) } })
    let temp = x.at(-1);
    if ((x.acum_busd < 0 && x.acum_busd_val > 0) || (x.acum_busd > 0 && x.acum_busd_val < 0)) {
      x.symbol = symbol;
      // console.table([x]);

    }
    out[symbol] = { floor: floor, data: x, max: max, top: top, busdkeys: busdkeys, ackeys: ackeys, prices: prices };
    // console.log(symbol)
    // console.table(max.sd)
    // console.table(max.bu)
    stat.res++;
    if (stat.res == totalFile) {
      console.log(stat, totalFile)
      resolve(out)
    }
  }


}

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(0);
    }, ms);
  });
}


const colours = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",
    crimson: "\x1b[38m" // Scarlet
  },
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    gray: "\x1b[100m",
    crimson: "\x1b[48m"
  }
};