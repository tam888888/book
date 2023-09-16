import fetch from "node-fetch";
import fs from "fs";
import log4js from "log4js";
import { Parser } from "json2csv"
import { Exchange } from "./Exchange.js";
import draftlog from 'draftlog'
import Table from "tty-table";
import CliTable3 from "cli-table3";
import chalk from "chalk";
var logger = log4js.getLogger();
import { Console } from 'node:console'
import { Transform } from 'node:stream'

const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk) } })
const log = new Console({ stdout: ts })

function getTable(data) {
  log.table(data)
  return (ts.read() || '').toString()
}

log4js.configure({
  appenders: {
    everything: {
      type: "file", filename: "table.log", layout: {
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
  let top = []
  let topG1 = []
  let delta = {};
  let deltaBatch = {};

  let intervalGet;
  let dir = "topdudinh"
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let asyncBatch = async () => {
    while (true) {
      // console.log("Console " + Date.now())
      let from = Date.now() + 7 * 60 * 60 * 1000 - 6 * 50 * 60 * 1000;
      function date2str(date) {
        let t = date.getFullYear() + "-"
          + (date.getMonth() + 1 < 10 ? ("0" + (date.getMonth() + 1)) : date.getMonth() + 1) + "-"
          + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate())
        return t;
      }
      let strdate = date2str(new Date());
      // console.log(date2str(new Date()))
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
                let f = 0;
                let first;
                let last;
                for (let p of data.data) {
                  let time = new Date(strdate + "T" + p.time);

                  if (time >= from) {
                    if (f == 0) {
                      first = p;
                      f++;
                    }
                    last = p;
                    // console.log(p.time, time, new Date(from))
                    // console.log(p)
                  }
                }
                if (first != undefined && last != undefined) {
                  let delta = ((first.change - last.change) * 100 / (first.price - first.change)).toFixed(2);
                  // if (Math.abs(delta) > 2)
                  // console.log("Change", symbol, (first.change - last.change).toFixed(2), delta, "%", first.price, first.total_vol)

                  table.push({
                    symbol: symbol,
                    change: (first.change - last.change),
                    delta: delta,
                    'change%': (first.change * 100 / (first.price - first.change)).toFixed(2),
                    price: first.price,
                    vol: first.total_vol
                  })
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
          // console.log("table", table)
          if (table == undefined || table.length == 0) {
            return;
          }
          var clitable = new CliTable3({ head: ['(Change1)', ...Object.keys(table[0])] })

          table = table.filter((e) => {
            return e.vol >= 50000;
          })
          table.sort((a, b) => {
            let x = a.delta - b.delta;
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
          table.slice(0, 15).forEach((e, i) => {
            clitable.push([i, ...coloring(e)]);
          })
          // console.log(clitable.toString())
          fs.appendFileSync(dir + "/change.log", getTable(table.slice(0, 15)) + "\n", (e) => { });
          let tb1 = clitable.toString();
          clitable = new CliTable3({ head: ['(Change2)', ...Object.keys(table[0])] })

          table.slice(table.length - 15, table.length).forEach((e, i) => {
            clitable.push([i, ...coloring(e)]);
          })
          // console.log(clitable.toString())
          let tb2 = clitable.toString();

          let a1 = tb1.split("\n");
          let a2 = tb2.split("\n");
          let z = a1.map((v, i) => {
            return v + "   " + a2[i] + "\n"
          })
          let c = z.reduce((a, b) => a + b, "");
          console.log(c)
          fs.appendFileSync(dir + "/change.log", getTable(table.slice(table.length - 15, table.length)) + "\n", (e) => { });

        });

      } catch (err) {
        logger.error(err)
      } finally {
        await wait(20000);
      }
    }
  }

  asyncBatch();


  while (true) {
    top.length = 0;
    topG1.length = 0;
    let z = Exchange.getliststockdata(listSymbol, stockdata);
    let str = [];
    z.then(data => {
      // console.log(data['HPG'])
      for (let key of Object.keys(data)) {
        let s = data[key];
        let g1 = s.g1;
        let a1 = g1.split("|");
        let a2 = s.g2.split("|");
        let atco = false;
        if (a1[0] == 'ATO' || a1[0] == 'ATC') {
          atco = true;
        }

        if (s.c == +a1[0] || s.c == s.lastPrice) {
          // console.log(a,s)
          top.push({
            symbol: key, p: atco ? s.lastPrice : +a1[0], v: atco ? (+a1[1] + +a2[1]) * 10 : +a1[1] * 10,
            atco: atco ? +a1[1] * 10 : 0, total: s.lot * 10, c: s.c, f: s.f, r: s.r, l: s.lastPrice, '%': ((s.lastPrice - s.r) * 100 / s.r)
          });
        }
        topG1.push({
          symbol: key, p: atco ? s.lastPrice : +a1[0], v: +a1[1] * 10,
          atco: atco ? +a1[1] * 10 : 0, total: s.lot * 10, c: s.c, f: s.f, r: s.r, l: s.lastPrice, '%': ((s.lastPrice - s.r) * 100 / s.r)
        });
        let e = delta[key];
        if (e == undefined || e == null)
          delta[key] = {
            symbol: key, p: atco ? s.lastPrice : +a1[0], v: atco ? (+a1[1] + +a2[1]) * 10 : +a1[1] * 10,
            atco: atco ? +a1[1] * 10 : 0, total: s.lot * 10, delta: 0, tps: 0, time: Date.now(), c: s.c, f: s.f, r: s.r, l: s.lastPrice, '%': ((s.lastPrice - s.r) * 100 / s.r)
          }
        else {
          let now = Date.now();
          let x = now - e.time;
          if (x >= 60 * 1000)
            delta[key] = {
              symbol: key, p: atco ? s.lastPrice : +a1[0], v: atco ? (+a1[1] + +a2[1]) * 10 : +a1[1] * 10,
              atco: atco ? +a1[1] * 10 : 0, total: s.lot * 10, lot: s.lot * 10, delta: (s.lot * 10 - e.total),
              tps: (s.lot * 10 - e.total) * 1000 / (Date.now() - e.time),
              time: now
              , c: s.c, f: s.f, r: s.r, l: s.lastPrice, '%': ((s.lastPrice - s.r) * 100 / s.r)
            }
          else {
            delta[key] = {
              symbol: key, p: atco ? s.lastPrice : +a1[0], v: atco ? (+a1[1] + +a2[1]) * 10 : +a1[1] * 10,
              atco: atco ? +a1[1] * 10 : 0, total: e.total, lot: s.lot * 10, delta: (s.lot * 10 - e.total),
              tps: (s.lot * 10 - e.total) * 1000 / (Date.now() - e.time),
              time: e.time
              , c: s.c, f: s.f, r: s.r, l: s.lastPrice, '%': ((s.lastPrice - s.r) * 100 / s.r)
            }
          }
        }
      }


      let format = (k, v) => {
        switch (k) {
          case 'p':
            return v.toString().padEnd(5)
          case 'v':
            return v.toString().padEnd(8)
          case 'atco':
            return v.toString().padEnd(8)
          case 'total':
            return v.toString().padEnd(8)
          case 'delta':
            return v.toString().padEnd(7)
          case 'tps':
            return v.toFixed(2).toString().padEnd(8)
          case 'lot':
            return v.toString().padEnd(8)
          case 'time':
            let d = new Date(v);
            return (d.getHours() + 7) + ":" + d.getMinutes() + ":" + d.getSeconds()
          case 'c':
          case 'f':
          case 'r':
          case 'l':
          case '%':
            return v.toFixed(2).toString().padEnd(5)
          default:
            return v;

        }
      }
      // console.log("================================================")
      // console.log("===================Du Dinh======================")
      let maxPrint = 15;
      let table = [];
      top.sort((a, b) => {
        return a.v > b.v ? -1 : a.v < b.v ? 1 : 0
      })
      let c = 0;
      let idx = 0;
      while (true) {
        if (top[idx] == undefined)
          break;
        if (top[idx].total > 0) {
          c++;
          // console.log(JSON.stringify(top[idx], format).replaceAll("\"", ""))
          table.push(top[idx]);
        }
        idx++;
        if (c > maxPrint) {
          break;
        }
      }

      topG1.sort((a, b) => {
        return a.v > b.v ? -1 : a.v < b.v ? 1 : 0
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

      let colorTop = (e) => {
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
          let f = i % 2 == 0 ? chalk.magenta : chalk.magentaBright;
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

      if (table.length > 0) {
        var clitable = new CliTable3({ head: ['(DuDinh)', ...Object.keys(table[0])] })


        table.forEach((e, i) => {
          clitable.push([i, ...coloring(e)]);
        })
        let dudinh = clitable.toString();
        console.log(dudinh)
        fs.appendFileSync(dir+"/dudinh.log", getTable(table)+"\n", (e)=>{});

      }

      // str.push(clitable.toString())
      // console.log("================================================")
      c = 0;
      idx = 0;
      table.length = 0;

      while (true) {
        if (topG1[idx] == undefined)
          break;
        if (topG1[idx].total > 0) {
          c++;
          // console.log(JSON.stringify(topG1[idx], format).replaceAll("\"", ""))
          table.push(topG1[idx]);
        }
        idx++;
        if (c > maxPrint) {
          break;
        }
      }

      var clitable = new CliTable3({ head: ['(G1)', ...Object.keys(table[0])] })

      table.forEach((e, i) => {
        clitable.push([i, ...coloring(e)]);
      })

      // console.log(clitable.toString())
      // str.push(clitable.toString())
      let dudinh = clitable.toString();
      console.log(dudinh)
      fs.appendFileSync(dir+"/topG1.log", getTable(table)+"\n", (e)=>{});


      let x = []
      for (let key of Object.keys(delta)) {
        x.push(delta[key]);
      }

      x.sort((a, b) => {
        return a.tps > b.tps ? -1 : a.tps < b.tps ? 1 : 0
      })

      // console.log("================================================")
      // console.log("======================TPS=======================")





      let t = 0;
      let g = 0;
      table.length = 0;
      for (let i = 0; i < maxPrint; i++) {
        // if (x[i]['%'] > 0) {
        //   t++;
        //   console.log(t % 2 == 0 ? colours.fg.green : colours.fg.magenta, JSON.stringify(x[i], format).replaceAll("\"", ""))
        // } else if (x[i]['%'] < 0) {
        //   g++;
        //   console.log(g % 2 == 0 ? colours.fg.red : colours.fg.blue, JSON.stringify(x[i], format).replaceAll("\"", ""))
        // } else {
        //   console.log(colours.fg.yellow, JSON.stringify(x[i], format).replaceAll("\"", ""))
        // }
        table.push(x[i]);
      }
      var clitable = new CliTable3({ head: ['(TPS)', ...Object.keys(table[0])] })
      table.forEach((e, i) => {
        clitable.push([i, ...coloring(e)]);
      })

      // console.log(clitable.toString())
      let tps = clitable.toString();
      console.log(tps)
      fs.appendFileSync(dir+"/tps.log", getTable(table)+"\n", (e)=>{});
      // str.push(clitable.toString())

      // console.log("======================VOL=======================")
      x.sort((a, b) => {
        return a.lot > b.lot ? -1 : a.lot < b.lot ? 1 : 0
      })
      table.length = 0;
      // clitable.length = 0;
      for (let i = 0; i < maxPrint; i++) {
        // if (x[i]['%'] > 0) {
        //   t++;
        //   console.log(t % 2 == 0 ? colours.fg.green : colours.fg.magenta, JSON.stringify(x[i], format).replaceAll("\"", ""))
        // } else if (x[i]['%'] < 0) {
        //   g++;
        //   console.log(g % 2 == 0 ? colours.fg.red : colours.fg.blue, JSON.stringify(x[i], format).replaceAll("\"", ""))
        // } else {
        //   console.log(colours.fg.yellow, JSON.stringify(x[i], format).replaceAll("\"", ""))
        // }
        table.push(x[i]);
      }

      // console.table(table)
      var clitable = new CliTable3({ head: ['(VOL)', ...Object.keys(table[0])] })

      table.forEach((e, i) => {
        clitable.push([i, ...coloring(e)]);
      })

      let vol = clitable.toString();
      console.log(vol)
      
      fs.appendFileSync(dir+"/vol.log", getTable(table)+"\n", (e)=>{});
      // console.log(clitable.toString())
      // str.push(clitable.toString())

      // console.log(str[0],"\n",str[1],"\n",str[2],"\n",str[3])

    })

    try {

    } catch (error) {
      logger.error(error);
    } finally {
      await wait(20000);
    }
  }

})();




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