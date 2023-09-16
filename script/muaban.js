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
    default: { appenders: ["console", "everything"], level: "debug" },
    app: { appenders: ["console"], level: "info" }
  },
});

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
  processData();

})();



async function processData() {
  let dir = "./trans/";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  // let __dirname = fs.realpathSync('.');

  let allSymbols = await Exchange.vndGetAllSymbols();

  let symbolExchange = {};

  allSymbols.forEach(v => {
    symbolExchange[v.code] = v.floor;
  });


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
  for (let v of args) {
    if (v.includes("date="))
      vss = v;

    if (v.includes("join="))
      update = v;

    if (v.includes("outlier="))
      outlier = v;
    // break;
    console.log(v)
  }
  if (update.toLocaleUpperCase().includes("TRUE")) {
    update = true;
  }
  if (outlier.toLocaleUpperCase().includes("TRUE")) {
    outlier = true;
  }
  let options = { update: update, outlier: outlier }
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
  while ((datekey = dateKeys.pop()) != undefined) {
    console.log(datekey)

    files = mapFiles[datekey];
    p.req++;
    let out = {};
    let promise = new Promise((resolve, reject) => {
      let stat = { req: 0, res: 0 };
      let length = files.length;
      files.forEach(async (f) => {
        try {
          processOne(f, symbolExchange, out, stat, resolve, length, options)
        } catch (error) {
          console.log(f, error)
        }
        // console.log(stat.req, stat.res)
        while (stat.req - stat.res >= 100) {
          await wait(10);
        }
      });
    })


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
      let pp = new Promise((resolve, reject) => {
        let length = Object.keys(res).length;
        // let res = 0; 
        let accum = 0;
        Object.keys(res).forEach((symbol, index) => {
          let symbolData = res[symbol];
          let count = 0;
          if (symbolData.floor == 'HOSE') {
            let x = symbolData.data;

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
                if (v["Oval_bu"] > 0 || v["Oval_sd"]) {
                  // v.symbol = symbol;
                  oulier.push({symbol:symbol,...v})
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

          }
          // console.log(index,length,symbolData.floor,x.length,count)
          if (index + 1 == length) {
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

            let session = options.session;
            if (session == undefined) session = 2000;
            if (options.outlier) {
              let out = [...values];
              out = out.reverse();
              if (fs.existsSync("./vnindex/" + "VNINDEX" + "_" + floor + "_5p.json")) {
                let jsonData = fs.readFileSync("./vnindex/" + "VNINDEX" + "_" + floor + "_5p.json")
                let json = new String(jsonData).toString().split("\n").map(e => {
                  if (e.length > 0) {
                    return JSON.parse(e)
                  } else return []

                });
                json.forEach(e => {
                  out.push(...e.reverse());
                })
              }

              let outs = out.slice(0, session);
              let key = ['c', 'h', 'l', 'o', 'bu', 'val_bu', 'total_vol',
                'sum_vol', 'val', 'acum_val', 'sd', 'val_sd', 'pbu', 'psd',
                'puk', 'bs', 'sb', 'abu', 'asd', 'auk', 'rsd', 'rbu', 'bu-sd',
                'bu-sd_val', 'acum_busd', 'acum_busd_val', 'acum_val_bu',
                'acum_val_sd', 'rbusd', 'uk', 'val_uk', 'ruk'
              ];

              let outa = {};

              let check = (val) => {
                if (val == undefined || Number.isNaN(val)) {
                  return 0;
                }
                return val;
              }



              key.forEach(k => {
                outa[k] = outs.map(e => check(e[k]));
                let mean = stats.mean(outa[k])
                let std = stats.stdev(outa[k])

                let threshold = 1.645;
                for (let e of values) {
                  e["mean" + k] = Math.floor(mean * 100) / 100;
                  e["std" + k] = Math.floor(std * 100) / 100;
                  e["O" + k] = Math.floor((Math.abs(mean - check(e[k])) - threshold * std) * 100) / 100;
                  let or = Math.floor((Math.abs(mean - check(e[k])) - threshold * std) / Math.abs(mean) * 100) / 100;
                  e["OR" + k] = Number.isNaN(or) ? Number.MIN_SAFE_INTEGER : or;
                  if (e["O" + k] > 0 || e["OR" + k] > 0) {
                    // console.table([e])
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
                    console.log(bbo.length, values.length, symbol)
                    return;
                  }
                  Object.keys(bbe).forEach(k => {
                    e["BB" + k] = bbe[k];
                    e["BBC" + k] = bbe[k] - e['c'];
                  })
                })


              }

              // console.table([outa])
              // console.log(Object.keys(outs[0]))
              // console.table(outs.slice(0,10))
              // console.table(outs.slice(outs.length-10,outs.length-1))


              writeArrayJson2Xlsx(dir + "VNINDEX" + "_" + floor + "_Outlier_" + datekey + ".xlsx", oulier)
            }


            let strtable = getTable(values);
            let as = strtable.split("\n");
            let header = as[2] + "\n" + as[1] + "\n" + as[2];
            let str = "";
            as.forEach((l, i) => {
              str += l + "\n";
              if (i > 3 && (i - 3) % 20 == 0) {
                str += header + "\n";
              }
            })


            fs.writeFileSync(dir + "VNINDEX" + "_" + floor + "_table.log", str, (e) => { if (e) { console.log(e) } })
            fs.writeFileSync(dir + "VNINDEX" + "_" + floor + "_5p.json", JSON.stringify(values), (e) => { if (e) { console.log(e) } })
            writeArrayJson2Xlsx(dir + "VNINDEX" + "_" + floor + "_5p_" + datekey + ".xlsx", values)
            if (options.update)
              fs.appendFileSync("./vnindex/" + "VNINDEX" + "_" + floor + "_5p.json", JSON.stringify(values) + "\n", (e) => { if (e) { console.log(e) } })
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



async function processOne(file, symbolExchange, out, stat, resolve, totalFile, options) {
  stat.req++;
  let maxTopInterval = 10;
  let maxTopAll = 50;
  let interval = 2 * 60 * 1000;

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

    data.forEach((v, i) => {
      // console.log(v)
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
      let p = +v.price;
      // console.log(v)
      e.c = p;
      if (e.h == undefined) e.h = p
      if (e.l == undefined) e.l = p
      if (e.h < p) e.h = p;
      if (e.l > p) e.l = p;
      if (e.o == undefined) e.o = p;
      let short = false;
      if (v.price.indexOf(".") > 0) {
        short = true;
      }
      let val = short ? +v.match_qtty * p * 1000 : +v.match_qtty * p;
      switch (v.side) {
        case 'bu':
          e.bu = (e.bu == undefined) ? +v.match_qtty : e.bu + +v.match_qtty;
          e.val_bu = (e.val_bu == undefined) ? val : e.val_bu + val;
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
      }
      e.total_vol = +v.total_vol;
      e.sum_vol = (e.sum_vol == undefined) ? +v.match_qtty : e.sum_vol + +v.match_qtty
      e.val = (e.val == undefined) ? val : e.val + val;
      accum.acum_val = (accum.acum_val == undefined) ? val : accum.acum_val + val;
      e.acum_val = accum.acum_val;

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
      return e
    })

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
    accum = {};
    x.forEach(e => {
      accum.acum_busd = (accum.acum_busd == undefined) ? e['bu-sd'] : accum.acum_busd + e['bu-sd'];
      accum.acum_busd_val = (accum.acum_busd_val == undefined) ? e['bu-sd_val'] : accum.acum_busd_val + e['bu-sd_val'];
      accum.acum_val_bu = (accum.acum_val_bu == undefined) ? (e['val_bu'] == undefined) ? 0 : e['val_bu'] : accum.acum_val_bu + ((e['val_bu'] == undefined) ? 0 : e['val_bu'])
      accum.acum_val_sd = (accum.acum_val_sd == undefined) ? (e['val_sd'] == undefined) ? 0 : e['val_sd'] : accum.acum_val_sd + ((e['val_sd'] == undefined) ? 0 : e['val_sd']);
      e['acum_busd'] = accum.acum_busd;
      e['acum_busd_val'] = accum.acum_busd_val;
      e['acum_val_bu'] = accum.acum_val_bu;
      e['acum_val_sd'] = accum.acum_val_sd;
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
    let session = options.session;
    if (session == undefined) session = 2000;
    if (options.outlier) {
      let out = [...x];
      out = out.reverse();
      if (fs.existsSync(dirAll + symbol + "_" + floor + "_5p.json")) {
        let jsonData = fs.readFileSync(dirAll + symbol + "_" + floor + "_5p.json")
        let json = new String(jsonData).toString().split("\n").map(e => {
          if (e.length > 0) {
            return JSON.parse(e)
          } else return []

        });
        json.forEach(e => {
          out.push(...e.reverse());
        })
      }

      let outs = out.slice(0, session);
      // if (symbol == "HPG") {
      //   console.log(Object.keys(x[0]))
      //   console.log(Object.keys(x[10]))
      //   console.log(Object.keys(x.at(-1)))
      // }
      let key = ['c', 'h', 'l', 'o', 'bu', 'val_bu', 'total_vol',
        'sum_vol', 'val', 'acum_val', 'sd', 'val_sd', 'pbu', 'psd',
        'puk', 'bs', 'sb', 'abu', 'asd', 'auk', 'rsd', 'rbu', 'bu-sd',
        'bu-sd_val', 'acum_busd', 'acum_busd_val', 'acum_val_bu',
        'acum_val_sd', 'rbusd', 'uk', 'val_uk', 'ruk'
      ];

      let outa = {};

      let check = (val) => {
        if (val == undefined || Number.isNaN(val)) {
          return 0;
        }
        return val;
      }



      key.forEach(k => {
        outa[k] = outs.map(e => check(e[k]));
        let mean = stats.mean(outa[k])
        let std = stats.stdev(outa[k])

        let threshold = 1.645;
        for (let e of x) {
          e["mean" + k] = Math.floor(mean * 100) / 100;
          e["std" + k] = Math.floor(std * 100) / 100;
          e["O" + k] = Math.floor((Math.abs(mean - check(e[k])) - threshold * std) * 100) / 100;
          let or = Math.floor((Math.abs(mean - check(e[k])) - threshold * std) / Math.abs(mean) * 100) / 100;
          e["OR" + k] = Number.isNaN(or) ? Number.MIN_SAFE_INTEGER : or;
          if (e["O" + k] > 0 || e["OR" + k] > 0) {
            // console.table([e])
          }
        }
      })

      if (outa['c'] != undefined) {
        const bb = { period: 20, stdDev: 2, values: outa['c'] };
        var bbo = BollingerBands.calculate(bb);
        let bbe = bbo.at(0);
        x.forEach((e, i) => {
          bbe = bbo.at(x.length - i);
          if (bbe == undefined || bbe == null) {
            console.log(bbo.length, x.length, symbol)
            return;
          }
          Object.keys(bbe).forEach(k => {
            e["BB" + k] = bbe[k];
            e["BBC" + k] = bbe[k] - e['c'];
          })
        })


      }

      // console.table([outa])
      // console.log(Object.keys(outs[0]))
      // console.table(outs.slice(0,10))
      // console.table(outs.slice(outs.length-10,outs.length-1))
    }

    fs.writeFileSync(dir + symbol + "_" + floor + "_table.log", str, (e) => { if (e) { console.log(e) } })
    fs.writeFileSync(dir + symbol + "_" + floor + "_5p.json", JSON.stringify(x), (e) => { if (e) { console.log(e) } })
    if (options.update)
      fs.appendFileSync(dirAll + symbol + "_" + floor + "_5p.json", JSON.stringify(x) + "\n", (e) => { if (e) { console.log(e) } })
    writeArrayJson2Xlsx(dir + symbol + "_" + floor + "_" + strdate0 + "_1N.xls", x)
    let csv = new Parser({ fields: ["abu", "acum_busd", "acum_busd_val", "acum_val_bu", "acum_val_sd", "acum_val", "avg_val_bu", "avg_val_sd", "rbusd", "asd", "auk", "bs", "bu", "bu-sd", "bu-sd_val", "c", "date", "datetime", "h", "l", "o", "pbu", "psd", "puk", "rbu", "rsd", "ruk", "sb", "sd", "sum_vol", "total_vol", "uk", "val", "val_bu", "val_sd", "val_uk"] });
    let data2 = csv.parse(x);
    fs.writeFileSync(dir + symbol + "_" + floor + "_1N.csv", data2 + "\n", (e) => { if (e) { console.log(e) } })
    let temp = x.at(-1);
    if ((x.acum_busd < 0 && x.acum_busd_val > 0) || (x.acum_busd > 0 && x.acum_busd_val < 0)) {
      x.symbol = symbol;
      // console.table([x]);

    }
    out[symbol] = { floor: floor, data: x, max: max, top: top };
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