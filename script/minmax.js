import fetch from "node-fetch";
import fs from "fs";
import log4js from "log4js";
import { Parser } from "json2csv"
import { SMA, EMA, RSI, StochasticRSI, MACD, MFI, BollingerBands } from 'technicalindicators';
import IchimokuCloud from 'technicalindicators'
import path from "path";
import { Symbol, Stock } from "./StockData.js";
import { Exchange } from "./Exchange.js";
import { type } from "os";
import json2csv2 from "json2csv"
import { create, all } from 'mathjs'
import TA from 'ta-math'
const config = {}
const math = create(all, config)

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
  let stat = { req: 0, res: 0 }

  files = ["HPG_HOSE_trans.txt"]
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
  data = data.reverse();
  data = data.slice(1);

  if (logger.isDebugEnabled)
    logger.debug(data);

  let check = (val) => {
    if (val == undefined || val == null || Number.isNaN(val) || (!Number.isFinite(val))) {
      return 0;
    }
    return val;
  }

  var NN = data.map(e => {

    return {
      priceClose: check(+e.priceClose / +e.adjRatio),
      priceHigh: check(+e.priceHigh / +e.adjRatio),
      priceLow: check(+e.priceLow / +e.adjRatio),
      priceBasic: check(+e.priceBasic / +e.adjRatio),
      priceOpen: check(+e.priceOpen / +e.adjRatio),
      priceAverage: check(+e.priceAverage / +e.adjRatio),
      dealVolume: check(+e.dealVolume),
      date: new Date(e.date.replace(/"/g, '')),
    };
  })


  var taa = data.map(e => {

    return [new Date(e.date.replace(/"/g, '')),
    check(+e.priceOpen / +e.adjRatio),
    check(+e.priceHigh / +e.adjRatio),
    check(+e.priceLow / +e.adjRatio),
    check(+e.priceClose / +e.adjRatio),
    check(+e.dealVolume),
    ];
  })

  let Pivot = [];

  let zigzag = async (a, depth, dev) => {


    let findZig = (a, index, length, isHigh) => {
      let da = index >= length ? a[index - length] : [0, 0, 0, 0, 0, 0];
      // console.log(da,index)
      let p = isHigh ? da[2] : da[3];
      if (length == 0) {
        return [da[0], p, index]
      } else if (length * 2 <= index) {
        let isFound = true;
        for (let i = 0; i <= length - 1; i++) {
          if ((isHigh && a[index - i][2] > p) || (!isHigh && a[index - i][3] < p)) {
            isFound = false;
            break;
          }
        }
        for (let i = length + 1; i <= 2 * length; i++) {
          if ((isHigh && a[index - i][2] >= p) || (!isHigh && a[index - i][3] <= p)) {
            isFound = false;
            break;
          }
        }
        if (isFound) {
          return [da[0], p, index - length]
        }
      }
    }


    let length = Math.floor(depth / 2)

    let newPivot = (z, isHigh, dev) => {
      let s = Pivot.length;
      let lastPivot = s > 0 ? Pivot[s - 1] : null
      if (lastPivot != null) {
        if (lastPivot.isHigh == isHigh) {
          let m = isHigh ? 1 : -1
          let isMore = z[1] * m > lastPivot.e[1] * m
          if (isMore) {
            lastPivot.e = z;
          }
        }
        else {
          // console.log(Math.abs((lastPivot.e[1] - z[1]) * 100 / lastPivot.e[1]), dev)
          if (Math.abs((lastPivot.e[1] - z[1]) * 100 / lastPivot.e[1]) >= dev) {
            Pivot.push({ s: lastPivot.e, e: z, isHigh: isHigh });
            console.log({ s: lastPivot, e: z, isHigh: isHigh })
          }
        }

      } else {
        Pivot.push({ s: z, e: z, isHigh: isHigh });
        console.log({ s: z, e: z, isHigh: isHigh })
      }
    }



    let promise = new Promise((resolve) => {
      for (let i = 0; i < taa.length; i++) {
        let z = findZig(taa, i, length, true);
        // console.log(z)
        if (z != undefined)
          newPivot(z, true, dev)
        let z1 = findZig(taa, i, length, false);
        if (z1 != undefined)
          newPivot(z1, false, dev)

        if (i == taa.length - 1) {
          // console.log(taa.length)
          // // console.log(Pivot)
          // for (let e of Pivot) {
          //   console.log(e)
          // }
          resolve(Pivot)
        }
      }
    })



    return await promise;

  }


  let p = await zigzag(data, 10, 5);

  for (let e of p) {
    // console.log(e)
    console.log((e.e[1]-e.s[1])*100/e.s[1])
  }



  const ta = new TA(taa, TA.exchangeFormat);

  let ret = ta.zigzag(35);
  let mm = {};
  ret.time.forEach((e, i) => {
    mm[e] = ret.price[i];
  })

  let mm2 = {};

  p.forEach((e,i)=>{
    mm2[e.s[0]] = e.s[1]
    mm2[e.e[0]] = e.e[1]
  })

  console.log(ret)
  // NN.forEach(e => {
  //   console.log(e.date)
  // });

  let session = 0;
  let NNS;
  if (session > 0) {
    NNS = NN.slice(0, session);
  } else {
    NNS = NN;
  }


  let checkSession = 10;
  let ft = {
    min: 0,
    max: 1
  }
  let cal = (val, idx, a, key, f) => {
    let left = idx - checkSession;
    let right = idx + checkSession;
    if (left < 0) left = 0;
    if (right >= a.length) right = a.length - 1;

    for (let i = left; i <= right; i++) {
      if (i == idx) continue;

      if (f == ft.max && val <= a[i][key]) {
        return 0;
      }
      if ((f == ft.min) && (val >= a[i][key])) {
        return 0;
      }
    }
    return val;
  }


  var MM = NNS.map((e, i, a) => {

    return {
      min: {
        priceClose: cal(e.priceClose, i, a, "priceClose", ft.min),
        priceHigh: cal(e.priceHigh, i, a, "priceHigh", ft.min),
        priceLow: cal(e.priceLow, i, a, "priceLow", ft.min),
        priceBasic: cal(e.priceBasic, i, a, "priceBasic", ft.min),
        priceOpen: cal(e.priceOpen, i, a, "priceOpen", ft.min),
        priceAverage: cal(e.priceAverage, i, a, "priceAverage", ft.min),
      },
      max: {
        priceClose: cal(e.priceClose, i, a, "priceClose", ft.max),
        priceHigh: cal(e.priceHigh, i, a, "priceHigh", ft.max),
        priceLow: cal(e.priceLow, i, a, "priceLow", ft.max),
        priceBasic: cal(e.priceBasic, i, a, "priceBasic", ft.max),
        priceOpen: cal(e.priceOpen, i, a, "priceOpen", ft.max),
        priceAverage: cal(e.priceAverage, i, a, "priceAverage", ft.max),
      },
      date: e.date,
      dealVolume: check(+e.dealVolume),
    };
  });




  stat.res++;
  // console.log(NN);
  if (stat.res % 10 == 0) {
    console.log(stat);
  }



  let checkDelta = [];
  let counter = 0;
  let promise = new Promise((sol, reject) => {

    MM.forEach((e, i) => {
      if (e.max.priceHigh != 0 || e.min.priceLow != 0) {
        checkDelta.push(counter);
        counter = 0;
      } else {
        counter++;
      }

      if (i == MM.length - 1) {
        sol(checkDelta);
      }

      // if (counter == 27) {
      //   console.log("max", i, e.max.priceHigh, e.date, "=======");
      // }
      // if (e.max.priceHigh > 0)
      //   console.log("max", i, e.max.priceHigh, e.date);

      // if (e.min.priceLow > 0)
      //   console.log("min", i, e.min.priceLow, e.date);
    })
  });


  promise.then(data => {
    console.log(math.mean(data));
    console.log(data)
  })


  let out = NNS.map((e, i) => {
    let ec = Object.assign({}, e);
    ec["maxPriceHigh"] = MM[i].max.priceHigh;
    ec["minPriceLow"] = MM[i].min.priceLow;

    let x = mm[e.date];

    ec["ZigZag"] = x == undefined || x == null ? 0 : x;
    let x1 = mm2[e.date];
    ec["ZigZag1"] = x1 == undefined || x1 == null ? 0 : x1;
    return ec;
  })

  if (stat.res == stat.req) {
    resolve(summarySymbol);
  }
  // priceClose: check(+e.priceClose / +e.adjRatio),
  // priceHigh: check(+e.priceHigh / +e.adjRatio),
  // priceLow: check(+e.priceLow / +e.adjRatio),
  // priceBasic: check(+e.priceBasic / +e.adjRatio),
  // priceOpen: check(+e.priceOpen / +e.adjRatio),
  // priceAverage: check(+e.priceAverage / +e.adjRatio),
  // dealVolume: check(+e.dealVolume),
  // date: new Date(e.date),

  let csv = new json2csv2.Parser(
    {
      fields: ['date', 'dealVolume', 'priceAverage', 'priceBasic', 'priceClose', 'priceHigh', 'priceLow', 'priceOpen', 'maxPriceHigh', 'minPriceLow', 'ZigZag','ZigZag1']
    });



  let data2 = csv.parse(out);
  fs.writeFile("./minmax.csv", data2 + "\n", function (err) {
    if (err) throw err;
  });



  // var sym = new Symbol("symbol", high, low, prices, vol);


  // checkMA(high, low, basic, prices, vol, path.substr(4, 3), path);

  // var ichimokuInput = {
  //   high: high,
  //   low: low,
  //   conversionPeriod: 9,
  //   basePeriod: 26,
  //   spanPeriod: 52,
  //   displacement: 26
  // }

  // var ichimoku = IchimokuCloud.ichimokucloud(ichimokuInput)
  // if (logger.isDebugEnabled)
  //   logger.debug(ichimoku);

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

