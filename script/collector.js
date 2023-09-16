import fetch from "fetch";
import fs from "fs";
import log4js from "log4js";
import { Parser } from "json2csv"
import { SMA, EMA, RSI, StochasticRSI, MACD, MFI, BollingerBands } from 'technicalindicators';
import IchimokuCloud from 'technicalindicators'
import path from "path";
import { Symbol, Stock } from "./StockData.js";
import { Exchange } from "./Exchange.js";
import { ok } from "assert";


var logger = log4js.getLogger();

log4js.configure({
  appenders: {
    everything: { type: "file", filename: "beta2.log" },
    console: { type: "console" },
  },
  categories: {
    default: { appenders: ["everything", "console"], level: "INFO" },
  },
});


let stockData = {};
let req = 0;
let res = 0;
let set = new Set();

(async () => {

  let company = [];
  let counter = 0;
  let a = await Exchange.stocks();
  let x = await a.json();

  let listed = x.data.filter(e => { if (e.status == "listed") { return true } else return false; })

  for (let e of listed) {
    if (e.code.length >= 4 || e.code == "GCF") {
      continue;
    }
    collect(stockData, e.code);
    while (req - res >= 100) {
      await wait(100);
    }
    if (req % 10 == 0) {
      logger.info("req", req, "res", res);
    }
  }
  while (req != res) {
    await wait(1000);
  }
  logger.info("Done")

  logger.info("retry ==================")
  req = 0;
  res = 0;
  while (true) {
    if (set.size == 0) {
      logger.info("Break set is zero!")
      break;
    }
    let list = set;
    for (let e of list) {
      try {
        collect(stockData, e);
        while (req - res >= 1) {
          await wait(10);
        }
      } catch (err) {
        console.log(err)
      }

    }
  }

  fs.writeFile("stock.json", JSON.stringify(stockData), function (err) {
    if (err) throw err;
  });


})();


function wait(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(0);
    }, ms);
  });
}

async function collect(stockData, symbol) {
  try {
    let func = [Exchange.fundamental, Exchange.financialIndicators, Exchange.finacialReport];
    let key = ["fundamental", "financialIndicators", "finacialReport"];

    let check = [(e) => { return e.beta != undefined },
    (e) => { return e.length > 0 },
    (e) => {
      return (e[1][1].data != undefined) && (e[1][1].data.rows != undefined) && (e[1][1].data.rows.length > 0)
    }];

    let ret = func.map(e => e(symbol));

    stockData[symbol] = {};
    req++;
    let ok = true;
    let i = 0;
    ret.forEach((value, index) => {
      try {
        value.then(res => res.json()).then(data => {
          if (!check[index](data)) {
            set.add(symbol);
            logger.info("not ok ", symbol, data)
            return;
          }
          if (index == check.length - 1) {
            set.delete(symbol);
          }
          stockData[symbol][key[index]] = data;
          i++;
          if (i == key.length) {
            res++;
          }
        });
      } catch (err) {
        ok = false;
        logger.error(err);
      }
    });
    // if (!ok) {
    //   set.add(symbol);
    // }else{
    //   set.delete(symbol);
    // }
  } catch (err) {
    console.log(err)
  }
  return ok;
}