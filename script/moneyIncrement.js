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
    everything: { type: "file", filename: "stock.log" },
    console: { type: "console" },
  },
  categories: {
    default: { appenders: ["everything", "console"], level: "INFO" },
  },
});


let ss = 5;

(async () => {

  var args = process.argv.slice(2);
  let vss = null;
  for (let v of args) {
    if (v.includes("ss="))
      vss = v;
    break;
  }

  ss = vss == null ? 5 : Number.parseInt(vss.substring(3));
  if (ss == undefined || ss < 0 || Number.isNaN(ss)) {
    ss = 5;
  }

  let company = [];
  let counter = 0;
  company = await Exchange.getlistallstock();
  let symbols = new Set();

  company.forEach((e) => {
    if (e.stock_code.length <= 3) {
      symbols.add(e.stock_code + "_" + e.post_to + "_trans.txt");
    }
  })

  let dir = "./his/";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  let files = fs.readdirSync(dir);
  let stat = { req: 0, res: 0 }

  // files = ["HPG_HOSE_trans.txt"]
  for (const file of files) {
    if (symbols.has(file)) {
      stat.req++;
    }
  }


  let promise = new Promise((resolve, reject) => {
    for (const file of files) {
      if (symbols.has(file)) {
        loadData(path.join(dir, file).toString(), resolve, stat);
      }
    }
  });

  let ret = await promise;

  console.log(ret)
  fs.writeFile("NDTNN.json", JSON.stringify(ret), e => { });
})();



let summarySymbol = {};
async function loadData(path, resolve, stat) {
  var data = fs.readFileSync(path)
    .toString()
    .split('\n')
    .map(e => e.trim())
    .map(e => e.split(',').map(e => e.trim()));
  let head = data[0];
  data = data.slice(1);
  data = data.map(e => {
    let x = {};
    for (let i = 0; i < head.length; i++) {
      x[head[i].replaceAll("\"", "")] = e[i];
    }
    return x;
  })
  // data = data.reverse();
  // data = data.slice(1);

  if (logger.isDebugEnabled)
    logger.debug(data);

  // var prices = data.map(e => +e.priceClose / +e.adjRatio);
  // var high = data.map(e => +e.priceHigh / +e.adjRatio);
  // var low = data.map(e => +e.priceLow / +e.adjRatio);
  // var basic = data.map(e => +e.priceBasic / +e.adjRatio);
  // var open = data.map(e => +e.priceOpen / +e.adjRatio);
  // var vol = data.map(e => +e.dealVolume);
  let check = (val) => {
    if (val == undefined || Number.isNaN(val)) {
      // console.log(path,val)
      return 0;
    }
    return val;
  }
  var NN = data.map(e => {
    // console.log(e)
    return [check(+e.buyForeignQuantity), check(+e.buyForeignValue), check(+e.sellForeignQuantity), check(+e.sellForeignValue), check(+e.priceClose)];
  })





  // console.log("Number Session ", ss)
  let session = ss;
  let NNS;
  if (session > 0) {
    if(session > NN.length)
      NNS = NN.slice(0, session);
    else{
      NNS = NN;
    }
  } else {
    NNS = NN;
  }



  let NN2 = NNS.reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3], a[4]], [0, 0, 0, 0, NN[0][4]]);
  stat.res++;
  // console.log(NN);
  if (stat.res % 10 == 0) {
    console.log(stat);
  }

  if (path.substr(4, 3) == "HPG" || path.substr(4, 3) == "XDC"
    || path.substr(4, 3) == "PDR"
  ) {
    // console.log(NN2)
    // console.log(NN)
    for (let e of NN) {
      // console.log(e)
    }
  }

  // NN2 = NN2.map((e) => {
  //   return {
  //     b: e[0],
  //     bv: e[1],
  //     s: e[2],
  //     sv: e[3],
  //     p: e[4]
  //   };
  // });
  let e = NN2;
  NN2 = {
    b: e[0],
    bv: e[1],
    s: e[2],
    sv: e[3],
    p: e[4]
  };
  // if (NN2[0] != 0 || NN2[2] != 0)
  if (NN2.b != 0 || NN2.s != 0)
    summarySymbol[path.substr(4, 3)] = NN2;

  if (stat.res == stat.req) {
    resolve(summarySymbol);
  }




}
let gap = [];




async function checkMA(high, low, basic, prices, vol, symbol, path) {
  let shortPeriods = [5, 8, 20, 50];
  let longPeriods = [5, 8, 20, 50];
  let volPeriods = [5, 20];


  let smaRet = shortPeriods.map(e => { return SMA.calculate({ period: e, values: prices }); });
  let smaVolRet = volPeriods.map(e => { return SMA.calculate({ period: e, values: vol }); });
  let emaRet = shortPeriods.map(e => { return EMA.calculate({ period: e, values: prices }); });


  if (smaVolRet[0].at(-1) > 50000) {

    var inputRSI = {
      values: prices,
      period: 14
    };


    var rsi = RSI.calculate(inputRSI);
    var ratio = vol.at(-1) / smaVolRet[0].at(-1);
    let itl = -50;
    var min = Math.min(...high.slice(itl), ...low.slice(itl), ...prices.slice(itl));
    var max = Math.max(...high.slice(itl), ...low.slice(itl), ...prices.slice(itl));

    let ex = (path) => {
      return path.includes("HOSE") ? "HOSE" : path.includes("HNX") ? "HNX" : "UPCOM";
    }

    if (
      (smaVolRet[0].at(-1) > 1.2 * smaVolRet[1].at(-1))
      && (smaVolRet[0].at(-2) > 1.2 * smaVolRet[1].at(-2))
      && (smaVolRet[0].at(-3) > 1.2 * smaVolRet[1].at(-3))
      && (smaVolRet[0].at(-4) > 1.2 * smaVolRet[1].at(-4))
      && (((prices.at(-1) - min) * 100.0 / min) < 15)
    ) {

      console.log(ex(path).padEnd(5), symbol,
        "min", min.toFixed(2).padEnd(6),
        "max", max.toFixed(2).padEnd(6),
        "ratio", ((prices.at(-1) - min) * 100.0 / min).toFixed(2).padEnd(6),
        " rsi ", (rsi.at(-1) + "").padEnd(5),
        " vol ", (vol.at(-1) + "").padEnd(8),
        " sma5 ", smaVolRet[0].at(-1).toString().padEnd(8),
        "lastprice", prices.at(-1).toFixed(2).padEnd(6),
        "change", (prices.at(-1) - basic.at(-1)).toFixed(2).padStart(5).padEnd(6),
        "%", ((prices.at(-1) - basic.at(-1)) * 100 / basic.at(-1)).toFixed(2).padStart(5).padEnd(6)
      )
    }
    if (ratio > 1.3) {
      // console.log("Vol", symbol, vol.at(-1), " sma5 ", smaVolRet[0].at(-1), " rsi ", rsi.at(-1), " ratio ", ratio);
    }

    // console.log(rsi.at(-1));
    var p1 = path.indexOf("/", 0) + 1;
    var p2 = path.indexOf("_", 0);
    var symbol = path.substr(p1, p2 - p1);
    // console.log(symbol)
    if (rsi[rsi.length - 1] <= 40 && symbol.length == 3) {
      let delta = prices.at(-1) - smaRet[2].at(-1);
      gap.push({
        ratio: (delta / smaRet[2].at(-1)), "symbol": symbol, "path": path,
        "price": prices.at(-1),
        "ma25": smaRet[2].at(-1),
        "vol": smaVolRet[0].at(-1),
        "rsi ": rsi[rsi.length - 1]
      });
    }

  }
}

