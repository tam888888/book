import fetch from "node-fetch";
import fs from "fs";
import log4js from "log4js";
import { Parser } from "json2csv"
import { SMA, EMA, RSI, StochasticRSI, MACD, MFI, BollingerBands } from 'technicalindicators';
import IchimokuCloud from 'technicalindicators'
import path from "path";
import { Symbol, Stock } from "./StockData.js";
import { Exchange } from "./Exchange.js";


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


(async () => {

  let company = [];
  let counter = 0;
  let a = await Exchange.stocks();
  let x = await a.json();

  let listed = x.data.filter(e => { if (e.status == "listed") { return true } else return false; })

  let req = 0;
  let res = 0;
  let set = new Set();
  for (let e of listed) {
    if (e.code.length >= 4) {
      continue;
    }
    try {
      let r = Exchange.ratios(e.code);
      // let r = Exchange.fundamental(e.code);
      req++;
      r.then(res => {
            return res.text();
        // try {
        //   let f = () => { return res.json()};
        //   return new Function('f', `return f()`)(f);     
        // } catch (e) {
        //   if (e.name !== 'SyntaxError') throw e 
        //   console.log(e)
        // }
      }).then(data => {                
        try {
          console.log(data);
          data = JSON.parse(data);
          if (data.data[0]['value'] != undefined)
            logger.info("Beta", req, res, data.data[0]['value'], e.code)
          else {
            // logger.info(data, e.code)
            set.add(e.code);
          }
        } catch (error) {
          // logger.error(data, e.code)
          set.add(e.code);
        }
        res++;
      })

      while (req - res >= 2) {
        await wait(100);
      }
      // let x = await r.json();
      // logger.info(x.data[0]['value'], e.code)
    } catch (err) {
      console.log(err)
    }
  }
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
        let r = Exchange.ratios(e.code);
        // let r = Exchange.fundamental(e);
        req++;
        r.then(res => { return res.text();
          // let f = () => { return res.json() };
          // let fe = new Function('f', `return f()`);
          // return fe(f);
        }).then(data => {
          try {
            // console.log(data);
            data = JSON.parse(data);
            if (data.data[0]['value'] != undefined) {
              logger.info("Beta", req, res, data.data[0]['value'], e)
              set.delete(e);
              console.log("delete")
            }
            else {
              // set.add(e);
            }
          } catch (error) {
            console.log(error)
            // set.add(e);
          }
          res++;
        })

        while (req - res >= 2) {
          await wait(10);
        }
      } catch (err) {
        console.log(err)
      }

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