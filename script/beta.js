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
    everything: { type: "file", filename: "beta.log" },
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


  for (let e of listed) {
    if(e.code.length >= 4){
      continue;
    }
    try {
      let r =await  Exchange.ratios(e.code);
      // r.then(res => res.text()).then(data=>{
      //   console.log(data, e.code,);
      // })
      let x = await r.json();
      // console.log(x.data[0]['value'], e.code);
      logger.info(x.data[0]['value'],e.code)
    } catch (err) { 
      console.log(err)

    }

  }
  // company.forEach((e) => {
  //   if (e.stock_code.length <= 3) {
  //     symbols.add(e.stock_code + "_" + e.post_to + "_trans.txt");
  //   }
  // })

  // gap.sort((a, b) => {
  //   if (a.ratio < b.ratio) return -1;
  //   if (a.ratio > b.ratio) return 1;
  //   return 0;
  // });


  // for (let e of gap) {
  //   logger.info(e);
  // }

})();
