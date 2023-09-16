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


(async () => {

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

  for (const file of files) {
    if (symbols.has(file)) {
      loadData(path.join(dir, file).toString());
    }
  }

  gap.sort((a, b) => {
    if (a.ratio < b.ratio) return -1;
    if (a.ratio > b.ratio) return 1;
    return 0;
  });


  for (let e of gap) {
    logger.info(e);
  }

})();

async function loadData(path) {
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
  data = data.reverse();
  data = data.slice(1);

  if (logger.isDebugEnabled)
    logger.debug(data);

  var prices = data.map(e => +e.priceClose / +e.adjRatio);
  var high = data.map(e => +e.priceHigh / +e.adjRatio);
  var low = data.map(e => +e.priceLow / +e.adjRatio);
  var basic = data.map(e => +e.priceBasic / +e.adjRatio);
  var open = data.map(e => +e.priceOpen / +e.adjRatio);
  var vol = data.map(e => +e.dealVolume);

  var sym = new Symbol("symbol", high, low, prices, vol);


  checkMA(high, low, basic, prices, vol, path.substr(4, 3), path);

  var ichimokuInput = {
    high: high,
    low: low,
    conversionPeriod: 9,
    basePeriod: 26,
    spanPeriod: 52,
    displacement: 26
  }

  var ichimoku = IchimokuCloud.ichimokucloud(ichimokuInput)
  if (logger.isDebugEnabled)
    logger.debug(ichimoku);

}
let gap = [];




async function checkMA(high, low, basic, prices, vol, symbol, path) {
  let shortPeriods = [5, 8, 20, 50];
  let longPeriods = [5, 8, 20, 50];
  let volPeriods = [5, 20];


  let smaRet = shortPeriods.map(e => { return SMA.calculate({ period: e, values: prices }); });
  let smaVolRet = volPeriods.map(e => { return SMA.calculate({ period: e, values: vol }); });
  let emaRet = shortPeriods.map(e => { return EMA.calculate({ period: e, values: prices }); });

  // console.log(smaVolRet[0].at(-1),smaRet[0].at(-1))
  if (smaVolRet[0].at(-1) > 100000) {
    if ((prices.at(-1) >= smaRet[0].at(-1))) {
      // logger.info(path);
      // logger.info("Price over SMA5", symbol, "prices ", prices.at(-1), " sma ", smaRet[0][smaRet[0].length - 1])
      // let delta =  prices.at(-1) - smaRet[2].at(-1);
      // gap.push({
      //   ratio: (delta / smaRet[2].at(-1)), "symbol": symbol, "path": path,
      //   "price": prices.at(-1),
      //   "ma25": smaRet[2].at(-1),
      //   "vol": smaVolRet[0].at(-1)
      // });
    } else {
      // logger.info("Price under SMA5", symbol, "prices ", prices.at(-1), " sma ", smaRet[0][smaRet[0].length - 1])
    }

    if ((prices.at(-1) >= smaRet[1].at(-1)) && (smaRet[1].at(-1) > smaRet[2].at(-1))) {
      // logger.info("Price over SMA9", symbol, "prices ", prices.at(-1), " sma ", smaRet[1].at(-1))
      // let delta =  prices.at(-1) - smaRet[2].at(-1);
      // gap.push({
      //   ratio: (delta / smaRet[2].at(-1)), "symbol": symbol, "path": path,
      //   "price": prices.at(-1),
      //   "ma25": smaRet[2].at(-1),
      //   "vol": smaVolRet[0].at(-1)
      // });      
    } else {
      // logger.info("Price under SMA9", symbol, "prices ", prices.at(-1), " sma ", smaRet[1][smaRet[1].length - 1])
    }

    if ((prices.at(-1) >= smaRet[2].at(-1))) {
      // logger.info("Price over SMA20", symbol, "prices ", prices.at(-1), " sma ", smaRet[2].at(-1))
    } else {
      // logger.info("Price under SMA25", symbol, "prices ", prices.at(-1), " sma ", smaRet[2].at(-1), smaVolRet[0].at(-1))

      let delta = smaRet[2].at(-1) - prices.at(-1);
      // gap.push({
      //   ratio: (delta / smaRet[2].at(-1)), "symbol": symbol, "path": path,
      //   "price": prices.at(-1),
      //   "ma25": smaRet[2].at(-1),
      //   "vol": smaVolRet[0].at(-1)
      // });
    }
    if ((prices.at(-1) >= smaRet[3].at(-1))) {
      // logger.info("Price over SMA50", symbol, "prices ", prices.at(-1), " sma ", smaRet[3].at(-1))
    } else {
      // logger.info("Price under SMA50", symbol, "prices ", prices.at(-1), " sma ", smaRet[3].at(-1), smaVolRet[0].at(-1))
    }


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

    if(
      (smaVolRet[0].at(-1) > 1.2 * smaVolRet[1].at(-1))
      &&(smaVolRet[0].at(-2) > 1.2 * smaVolRet[1].at(-2))
      &&(smaVolRet[0].at(-3) > 1.2 * smaVolRet[1].at(-3))
      &&(smaVolRet[0].at(-4) > 1.2 * smaVolRet[1].at(-4))
      && (((prices.at(-1) - min) * 100.0 / min) <15)
    ){

    console.log(ex(path).padEnd(5), symbol,
      "min", min.toFixed(2).padEnd(6),
      "max", max.toFixed(2).padEnd(6),
      "ratio", ((prices.at(-1) - min) * 100.0 / min).toFixed(2).padEnd(6),
      " rsi ", (rsi.at(-1) + "").padEnd(5),
      " vol ", (vol.at(-1) + "").padEnd(8),
      " sma5 ", smaVolRet[0].at(-1).toString().padEnd(8),
      "lastprice", prices.at(-1).toFixed(2).padEnd(6),
      "change", (prices.at(-1) - basic.at(-1)).toFixed(2).padStart(5).padEnd(6),
      "%", ((prices.at(-1) - basic.at(-1))*100/basic.at(-1)).toFixed(2).padStart(5).padEnd(6)
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

