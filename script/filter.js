import fetch from "node-fetch";
import fs from "fs";
import log4js from "log4js";
import { Parser } from "json2csv"
import { SMA, EMA, RSI, StochasticRSI, MACD, MFI, BollingerBands } from 'technicalindicators';
import IchimokuCloud from 'technicalindicators'
import path from "path";
import { Symbol, Stock } from "./StockData.js";
import { Exchange } from "./Exchange.js";
import { filter } from "mathjs";
import { Console } from 'node:console'
import { Transform } from 'node:stream'
import { e } from "mathjs";
import xlsx from "xlsx"

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

async function download() {
  console.log("Download")
  let vndGetAllSymbols = await Exchange.vndGetAllSymbols();
  let symbolsVnd = vndGetAllSymbols.filter(s => { return s.code.length <= 3 && s.status == 'listed' }).map(e => { return { code: e.code, floor: e.floor } })
  // console.table(symbolsVnd,symbolsVnd.length)
  // console.log(symbolsVnd, symbolsVnd.length)
  // console.table(vndGetAllSymbols)
  // console.log("calll")
  let industry = await Exchange.vndIndustryClassification();
  // console.log("calll2")
  let industryPE = await Exchange.vndIndustryPE();
  // console.log("calll3")
  let industryPB = await Exchange.vndIndustryPB();
  // console.log("calll4")
  let mapSymbol = {};
  let mapIndustry = {};
  // console.table(industry)

  let stat2 = { req: 0, res: 0 };
  let queue = [...symbolsVnd];
  let ratiosa = []
  while (true) {

    if (stat2.req - stat2.res >= 5) {
      if (stat2.res % 10 == 0) {
        console.log(stat2, queue.length)
      }
      await Exchange.wait(500);
      continue;
    }
    // queue.reverse();
    let symbol = queue.pop();
    if (symbol == undefined) {
      break;
    }
    stat2.req++;
    let ratios = Exchange.vndIndustryRatio(symbol.code);

    ratios.then(res => {
      stat2.res++;
      // console.log(res)
      ratiosa.push(res)
    });




  }
  // console.table(ratiosa)

  fs.writeFile("./profile/ratio.json", JSON.stringify(ratiosa), (e)=>{});


  industry.forEach(e => {
    let ne = {};
    ne.industryCode = e.industryCode;
    ne.name = e.vietnameseName;
    mapIndustry[e.industryCode] = ne;
    e.codeList.split(",").forEach(s => { mapSymbol[s] = ne });
  }
  )

  // console.table(industry)
  console.table(industryPE)
  console.table(industryPB)
}

async function industry() {

  let vndGetAllSymbols = await Exchange.vndGetAllSymbols();

  let symbolsVnd = vndGetAllSymbols.filter(
    s => {
      return s.code.length <= 3 && s.status == 'listed'
    }).map(e => { return { code: e.code, floor: e.floor } })

  let industry = await Exchange.vndIndustryClassification();
  let industryPE = await Exchange.vndIndustryPE();
  let industryPB = await Exchange.vndIndustryPB();
  let mapSymbol = {};
  let mapIndustry = {};
  let pbe = {};
  industryPB.forEach(e => { pbe[e.code] = { pb: e.value } })
  industryPE.forEach(e => { pbe[e.code] = { ...pbe[e.code], pe: e.value } })

  console.table(pbe)
  industry.forEach(e => {
    let ne = {};
    ne.industryCode = e.industryCode;
    ne.name = e.vietnameseName;
    ne = { ...ne, ...pbe[e.industryCode] }
    mapIndustry[e.industryCode] = ne;
    e.codeList.split(",").forEach(s => { mapSymbol[s] = ne });
  }
  )



  console.table(industryPE)
  console.table(industryPB)
  console.table(mapIndustry)
  console.table(mapSymbol['HPG'])

  let json = fs.readFileSync("./profile/ratio.json");

  let symbolRatio = JSON.parse(new String(json))
  console.log(symbolRatio[0])
  let filterData = symbolRatio.map(e => { return { pb: e.PB, pe: e.PE, symbol: e.symbol } });
  // console.table(filterData);

  let ok = filterData.filter(e => {
    if (e.pb == undefined || e.pe == undefined) return false;

    let ne = mapSymbol[e.symbol];

    if (ne.pb > e.pb && ne.pe > e.pe) {
      e.industryCode = ne.industryCode;
      e.name = ne.name;
      e.ipb = ne.pb;
      e.ipe = ne.pe;
      return true;
    }
    return false;
  })

  let out = {};
  ok.forEach(e => { out[e.symbol] = e })
  console.table(out)
  return out;
}


(async () => {

  var args = process.argv.slice(2);
  let vss = null;
  for (let v of args) {
    if (v.includes("download"))
      vss = v;
    break;
  }

  ss = vss == null ? undefined : vss;
  // if (ss == undefined || ss < 0 || Number.isNaN(ss)) {
  //   ss = 5;
  // }

  if(ss.includes("download"))
    await download();

  let out = await industry();

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
        loadData(path.join(dir, file).toString(), resolve, stat, out);
      }
    }
  });

  let ret = await promise;

  console.table(ret)


  let strtable = getTable(ret);
  let as = strtable.split("\n");
  let header = as[2] + "\n" + as[1] + "\n" + as[2];
  let str = "";
  as.forEach((l, i) => {
    str += l + "\n";
    if (i > 3 && (i - 3) % 20 == 0) {
      str += header + "\n";
    }
  })

  dir = "./filter/";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  console.table(str)
  let floor = "HOSE";
  fs.writeFileSync(dir + "Filter" + "_table.log", str, (e) => { if (e) { console.log(e) } })
  fs.writeFileSync(dir + "Filter" + "_5p.json", JSON.stringify(ret), (e) => { if (e) { console.log(e) } })
  writeArrayJson2Xlsx(dir + "Filter" + "_5p_" + ".xlsx", Object.values(ret))


  fs.writeFile("NDTNN.json", JSON.stringify(ret), e => { });
})();



let summarySymbol = {};
async function loadData(path, resolve, stat, filter) {
  var data = fs.readFileSync(path)
    .toString()
    .split('\n')
    .map(e => e.trim())
    .map(e => e.split(',').map(e => e.trim()));
  let head = data[0];
  data = data.slice(1, -1);
  data = data.map(e => {
    let x = {};
    for (let i = 0; i < head.length; i++) {
      x[head[i].replaceAll("\"", "")] = e[i];
    }
    return x;
  })

  if (logger.isDebugEnabled)
    logger.debug(data);


  let check = (val) => {
    if (val == undefined || Number.isNaN(val)) {
      // console.log(path,val)
      return 0;
    }
    return val;
  }


  data = data.map(e => {
    Object.keys(e).forEach(k => {
      if (k != 'date' && k != 'symbol')
        e[k] = +e[k];
      else {
        e[k] = e[k].replaceAll("\"", "");
      }
    })
    return e
  })
  let adj = ['priceAverage', 'priceBasic', 'priceClose', 'priceHigh', 'priceLow', 'priceOpen'];

  let filterData = data.map(e => {
    let ne = { ...e };
    adj.forEach(k => { ne[k] = e[k] / e.adjRatio })
    ne.adjRatio = 1.0;
    return ne;
  })


  let config = {
    avgValue: 10000000000,
    avgVol: 100000,
  }

  let symbol = data[0].symbol;



  let data30 = filterData.slice(0, 30);
  let sum = data30.reduce((a, b) => { return { dealVolume: (a.dealVolume + b.dealVolume), totalValue: (a.totalValue + b.totalValue) } }, { dealVolume: 0, totalValue: 0 })
  let avg = { symbol: symbol, avgValue: sum.totalValue / data30.length, avgVol: sum.dealVolume / data30.length };


  if (avg.avgValue < config.avgValue || avg.avgVol < config.avgVol) {
    stat.res++;
    if (stat.res == stat.req) {
      resolve(summarySymbol);
    }
    return;
  }
  filterData = filterData.reverse();
  let prices = filterData.map(e => e.priceClose);

  let shortPeriods = [10, 30];


  let smaRet = shortPeriods.map(e => { return SMA.calculate({ period: e, values: prices }); });
  // console.table(smaRet[0])
  // console.table(smaRet[1])
  if (smaRet[0].at(-1) < smaRet[1].at(-1)) {
    stat.res++;
    if (stat.res == stat.req) {
      resolve(summarySymbol);
    }
    return;
  }

  // console.table(filterData.slice(-10,-1));
  avg.sma10 = smaRet[0].at(-1);
  avg.sma30 = smaRet[1].at(-1);
  let pbe = filter[symbol];
  if (pbe == undefined) {
    stat.res++;
    if (stat.res == stat.req) {
      resolve(summarySymbol);
    }
    return;
  }



  avg = { ...avg, ...pbe }
  console.table([avg])
  summarySymbol[symbol] = avg;

  stat.res++;

  if (stat.res == stat.req) {
    resolve(summarySymbol);
  }




  if (stat.res % 1 == 0)
    console.log(stat)


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

