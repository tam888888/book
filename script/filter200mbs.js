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
import stats from "stats-analysis";

import http from "node:http";
import https from "node:https";

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
const agent = (_parsedURL) => _parsedURL.protocol == 'http:' ? httpAgent : httpsAgent;

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

    if (stat2.req - stat2.res >= 10) {
      if (stat2.res % 10 == 0) {
        console.log(stat2, queue.length)
      }
      await Exchange.wait(500);
      continue;
    }
    queue.reverse();
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

  // fs.writeFile("./profile/ratio.json", JSON.stringify(ratiosa), (e)=>{});


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

let shares = {}
async function ownership(list) {
  let promises = [];
  let stat = { req: 0, res: 0 }
  for (let symbol of list) {
    let a = fetch("https://restv2.fireant.vn/symbols/" + symbol + "/holders", {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7",
        "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IkdYdExONzViZlZQakdvNERWdjV4QkRITHpnSSIsImtpZCI6IkdYdExONzViZlZQakdvNERWdjV4QkRITHpnSSJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmZpcmVhbnQudm4iLCJhdWQiOiJodHRwczovL2FjY291bnRzLmZpcmVhbnQudm4vcmVzb3VyY2VzIiwiZXhwIjoxOTQ3MjQ3NzkxLCJuYmYiOjE2NDcyNDc3OTEsImNsaWVudF9pZCI6ImZpcmVhbnQudHJhZGVzdGF0aW9uIiwic2NvcGUiOlsib3BlbmlkIiwicHJvZmlsZSIsInJvbGVzIiwiZW1haWwiLCJhY2NvdW50cy1yZWFkIiwiYWNjb3VudHMtd3JpdGUiLCJvcmRlcnMtcmVhZCIsIm9yZGVycy13cml0ZSIsImNvbXBhbmllcy1yZWFkIiwiaW5kaXZpZHVhbHMtcmVhZCIsImZpbmFuY2UtcmVhZCIsInBvc3RzLXdyaXRlIiwicG9zdHMtcmVhZCIsInN5bWJvbHMtcmVhZCIsInVzZXItZGF0YS1yZWFkIiwidXNlci1kYXRhLXdyaXRlIiwidXNlcnMtcmVhZCIsInNlYXJjaCIsImFjYWRlbXktcmVhZCIsImFjYWRlbXktd3JpdGUiLCJibG9nLXJlYWQiLCJpbnZlc3RvcGVkaWEtcmVhZCJdLCJzdWIiOiIxZDY5YmE3NC0xNTA1LTRkNTktOTA0Mi00YWNmYjRiODA3YzQiLCJhdXRoX3RpbWUiOjE2NDcyNDc3OTEsImlkcCI6Ikdvb2dsZSIsIm5hbWUiOiJ0cmluaHZhbmh1bmdAZ21haWwuY29tIiwic2VjdXJpdHlfc3RhbXAiOiI5NTMyOGNlZi1jZmY1LTQ3Y2YtYTRkNy1kZGFjYWJmZjRhNzkiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ0cmluaHZhbmh1bmdAZ21haWwuY29tIiwidXNlcm5hbWUiOiJ0cmluaHZhbmh1bmdAZ21haWwuY29tIiwiZnVsbF9uYW1lIjoiVHJpbmggVmFuIEh1bmciLCJlbWFpbCI6InRyaW5odmFuaHVuZ0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6InRydWUiLCJqdGkiOiJhMTY2MDQwOGNhMGFkYWQxOTcwZDVhNWZhMmFjNjM1NSIsImFtciI6WyJleHRlcm5hbCJdfQ.cpc3almBHrGu-c-sQ72hq6rdwOiWB1dIy1LfZ6cgjyH4YaBWiQkPt4l7M_nTlJnVOdFt9lM2OuSmCcTJMcAKLd4UmdBypeZUpTZp_bUv1Sd3xV8LHF7FSj2Awgw0HIaic08h1LaRg0pPzzf-IRJFT7YA8Leuceid6rD4BCQ3yNvz8r58u2jlCXuPGI-xA8W4Y3151hpNWCtemyizhzi7EKri_4WWpXrXPAeTAnZSdoSq87shTxm9Kyz_QJUBQN6PIEINl9sIQaKL-I_jR9LogYB_aM3hs81Ga6h-n-vbnFK8JR1JEJQmU-rxyX7XvuL-UjQVag3LxQeJwH7Nnajkkg",
        "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site"
      },
      "referrerPolicy": "no-referrer",
      "body": null,
      "method": "GET",
      "mode": "cors",
      agent
    });
    stat.req++;
    let promise = a.then(res => res.json()).then(data => {
      stat.res++;

      let sum = data.reduce((a, b) => { return { ownership: a.ownership + b.ownership, shares: b.shares + a.shares } }, { ownership: 0, shares: 0 })
      sum.symbol = symbol;
      if (stat.res % 10 == 0) console.log(stat, sum);
      shares[symbol] = sum;
      return sum;
    }
    )
    promises.push(promise);
  }
  // console.log("------------ALLL----------")
  let all = await Promise.all(promises);
  //  console.log("------------ALLL----------",all)
  return all;
}

let symbolsListed = [];
async function industry() {

  let vndGetAllSymbols = await Exchange.vndGetAllSymbols();

  let symbolsVnd = vndGetAllSymbols.filter(
    s => {
      return s.code.length <= 3 && s.status == 'listed'
    }).map(e => { return { code: e.code, floor: e.floor } })

  // console.table(symbolsVnd)
  symbolsListed = symbolsVnd.map(e=>e.code)
  // console.table(symbolsListed)
  // ownership(symbolsVnd.map(e => e.code))
  let industry = await Exchange.vndIndustryClassification();
  let industryPE = await Exchange.vndIndustryPE();
  let industryPB = await Exchange.vndIndustryPB();
  let mapSymbol = {};
  let mapIndustry = {};
  let pbe = {};
  industryPB.forEach(e => { pbe[e.code] = { pb: e.value } })
  industryPE.forEach(e => { pbe[e.code] = { ...pbe[e.code], pe: e.value } })

  // console.table(pbe)
  industry.forEach(e => {
    let ne = {};
    ne.industryCode = e.industryCode;
    ne.name = e.vietnameseName;
    ne = { ...ne, ...pbe[e.industryCode] }
    mapIndustry[e.industryCode] = ne;
    e.codeList.split(",").forEach(s => { mapSymbol[s] = ne });
  }
  )



  // console.table(industryPE)
  // console.table(industryPB)
  // console.table(mapIndustry)
  // console.table(mapSymbol['HPG'])

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
  // console.table(out)
  return out;
}


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

  // await download();

  let out = await industry();

  let company = [];
  let counter = 0;
  // company = await Exchange.getlistallstock();
  // let symbols = new Set();

  // company.forEach((e) => {
  //   if (e.stock_code.length <= 3) {
  //     symbols.add(e.stock_code + "_" + e.post_to + "_trans.txt");
  //   }
  // })

  // let dir = "./his/";
  // if (!fs.existsSync(dir)) {
  //   fs.mkdirSync(dir);
  // }
  // let files = fs.readdirSync(dir);
  let stat = { req: 0, res: 0 }

  // files = ["HPG_HOSE_trans.txt"]
  // for (const file of files) {
  //   if (symbols.has(file)) {
  //     stat.req++;
  //   }
  // }

  stat.length = symbolsListed.length;

  let promise = new Promise(async (resolve, reject) => {
    let q = [...symbolsListed];
    let s = undefined;
    while ((s = q.pop()) != undefined) {
      while (stat.req - stat.res >= 15) {
        await Exchange.wait(200);
      }
      // console.log(s)

      if(stat.res %10 == 0){
        console.log(stat)
      }
      loadData(s, resolve, stat, out);
    }
  });

  let ret = await promise;

  // console.table(ret)


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

  let dir = "./filter/";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // console.table(str)
  let floor = "HOSE";
  fs.writeFileSync(dir + "Filter" + "_table.log", str, (e) => { if (e) { console.log(e) } })
  fs.writeFileSync(dir + "Filter" + "_5p.json", JSON.stringify(ret), (e) => { if (e) { console.log(e) } })
  writeArrayJson2Xlsx(dir + "Filter" + "_5p_" + ".xlsx", Object.values(ret))


  fs.writeFile("NDTNN.json", JSON.stringify(ret), e => { });
})();



let summarySymbol = {};
async function loadData(symbol, resolve, stat, filter) {
  stat.req++;
  var data = await Exchange.MBS.pbRltCharts2(symbol, "5", Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)) //Math.floor((Date.now() - 10000 * 24 * 60 * 60 * 1000) / 1000)
  // var data = fs.readFileSync(symbol)
  //   .toString()
  //   .split('\n')
  //   .map(e => e.trim())
  //   .map(e => e.split(',').map(e => e.trim()));
  // let head = data[0];
  // data = data.slice(1, -1);
  // data = data.map(e => {
  //   let x = {};
  //   for (let i = 0; i < head.length; i++) {
  //     x[head[i].replaceAll("\"", "")] = e[i];
  //   }
  //   return x;
  // })
  data = data.data;
  // console.table(data)
  if (logger.isDebugEnabled)
    logger.debug(data);

  if (data.t.length == 0) {
    stat.res++;
    if (stat.res == stat.length) {
      resolve(summarySymbol);
    }
    return;
  }

  let check = (val) => {
    if (val == undefined || Number.isNaN(val)) {
      // console.log(path,val)
      return 0;
    }
    return val;
  }


  // data = data.map(e => {
  //   Object.keys(e).forEach(k => {
  //     if (k != 'date' && k != 'symbol')
  //       e[k] = +e[k];
  //     else {
  //       e[k] = e[k].replaceAll("\"", "");
  //     }
  //   })
  //   return e
  // })
  let adj = ['priceAverage', 'priceBasic', 'priceClose', 'priceHigh', 'priceLow', 'priceOpen'];

  // let filterData = data.map(e => {
  //   let ne = { ...e };
  //   adj.forEach(k => { ne[k] = e[k] / e.adjRatio })
  //   ne.adjRatio = 1.0;
  //   return ne;
  // })

    let filterData = data.t.map((e,i) => {
    let ne = {};
    ne.time = e;
    ne.priceBasic = data.o[i];
    ne.priceClose = data.c[i];
    ne.priceHigh = data.h[i];
    ne.priceOpen = data.o[i];
    ne.priceLow = data.l[i];
    ne.dealVolume = data.v[i];
    ne.totalValue = data.v[i];
    // adj.forEach(k => { ne[k] = e[k] / e.adjRatio })
    // ne.adjRatio = 1.0;


    return ne;
  })
  filterData = filterData.reverse();

  let config = {
    avgValue: 0,
    avgVol: 0,
  }

  // let symbol = data[0].symbol;

  let days = [3, 7, 10, 15, 20, 30, 100, 200, 365, 500, 1000];

  let data30 = filterData.slice(0, 30);

  let datax = days.map(e => filterData.slice(0, e));


  let sum = data30.reduce((a, b) => { return { dealVolume: (a.dealVolume + b.dealVolume), totalValue: (a.totalValue + b.totalValue) } }, { dealVolume: 0, totalValue: 0 })
  let avg = { symbol: symbol, avgValue: sum.totalValue / data30.length, avgVol: sum.dealVolume / data30.length };
  avg.avgValue = Math.floor(avg.avgValue * 100) / 100
  avg.avgVol = Math.floor(avg.avgVol * 100) / 100

  // if (avg.avgValue < config.avgValue || avg.avgVol < config.avgVol) {
  //   stat.res++;
  //   if (stat.res == stat.length) {
  //     resolve(summarySymbol);
  //   }
  //   return;
  // }
  filterData = filterData.reverse();
  let prices = filterData.map(e => e.priceClose);
  let vols = filterData.map(e => e.dealVolume);

  avg.priceClose = Math.floor(prices.at(-1) * 100) / 100;
  avg.priceLow = Math.floor(filterData.at(-1).priceLow * 100) / 100;
  avg.priceHigh = Math.floor(filterData.at(-1).priceHigh * 100) / 100;
  avg.priceOpen = Math.floor(filterData.at(-1).priceOpen * 100) / 100;
  avg.priceBasic = Math.floor(filterData.at(-1).priceBasic * 100) / 100;
  avg.pct = Math.floor((filterData.at(-1).priceClose - filterData.at(-1).priceBasic) / filterData.at(-1).priceBasic * 10000) / 100
  let os = shares[symbol];
  avg.ownership = os != undefined ? os.ownership : 0;
  avg.shares = os != undefined ? os.shares : 0;
  let hl = days.map((e, i) => { return [...datax[i].map(e => e.priceHigh), ...datax[i].map(e => e.priceLow)] })
  let hlp = days.map((e, i) => { return [...datax[i].map(e => (e.priceHigh - e.priceBasic) * 100 / e.priceBasic), ...datax[i].map(e => (e.priceLow - e.priceBasic) * 100 / e.priceBasic)] })
  let c = days.map((e, i) => { return [...datax[i].map(e => e.priceClose)] })
  let cp = days.map((e, i) => { return [...datax[i].map(e => (e.priceClose - e.priceBasic) * 100 / e.priceBasic)] })
  let vol = days.map((e, i) => { return [...datax[i].map(e => e.dealVolume)] })
  let val = days.map((e, i) => { return [...datax[i].map(e => e.totalValue)] })
  let threshold = 1.645;
  avg.vol = filterData.at(-1).dealVolume;
  avg.val = filterData.at(-1).totalValue;
  days.forEach((e, i) => {
    avg["mean" + e] = Math.floor(stats.mean(c[i]) * 100) / 100;
    avg["std" + e] = Math.floor(stats.stdev(c[i]) * 100) / 100;
    avg["meanHL" + e] = Math.floor(stats.mean(hl[i]) * 100) / 100;
    avg["stdHL" + e] = Math.floor(stats.stdev(hl[i]) * 100) / 100;
    avg["meanHLP" + e] = Math.floor(stats.mean(hlp[i]) * 100) / 100;
    avg["stdHLP" + e] = Math.floor(stats.stdev(hlp[i]) * 100) / 100;
    avg["stdCP" + e] = Math.floor(stats.stdev(cp[i]) * 100) / 100;
    avg["meanCP" + e] = Math.floor(stats.mean(cp[i]) * 100) / 100;
    avg["meanVol" + e] = Math.floor(stats.mean(vol[i]) * 100) / 100;
    avg["stdVol" + e] = Math.floor(stats.mean(vol[i]) * 100) / 100;
    // if (symbol == "STB") console.log(i, e, stats.mean(vol[i]), vol[i].at(0), stats.stdev(vol[i]), Math.floor((Math.abs(stats.mean(vol[i]) - vol[i].at(0)) - threshold * stats.stdev(vol[i])) * 100) / 100)
    avg["OVol" + e] = Math.floor((Math.abs(stats.mean(vol[i]) - vol[i].at(0)) - threshold * stats.stdev(vol[i])) * 100) / 100;
    avg["ORVol" + e] = Math.floor((Math.abs(stats.mean(vol[i]) - vol[i].at(0)) - threshold * stats.stdev(vol[i])) / Math.abs(stats.mean(vol[i])) * 100) / 100;
    avg["meanVal" + e] = Math.floor(stats.mean(val[i]) * 100) / 100;
    avg["stdVal" + e] = Math.floor(stats.mean(val[i]) * 100) / 100;
    // if (symbol == "STB") console.log(i, e, stats.mean(val[i]), val[i].at(0), stats.stdev(val[i]), Math.floor((Math.abs(stats.mean(val[i]) - val[i].at(0)) - threshold * stats.stdev(val[i])) * 100) / 100)
    avg["OVal" + e] = Math.floor((Math.abs(stats.mean(val[i]) - val[i].at(0)) - threshold * stats.stdev(val[i])) * 100) / 100;
    avg["ORVal" + e] = Math.floor((Math.abs(stats.mean(val[i]) - val[i].at(0)) - threshold * stats.stdev(val[i])) / Math.abs(stats.mean(val[i])) * 100) / 100;
    // console.log(symbol, cp[i].at(0),c[i][0])
    avg["OCP" + e] = Math.floor((Math.abs(stats.mean(cp[i]) - cp[i].at(0)) - threshold * stats.stdev(cp[i])) * 100) / 100;
    let min = Math.min(...hl[i]);
    let max = Math.max(...hl[i]);
    avg["min" + e] = min;
    avg["max" + e] = max;
    avg["%MM" + e] = Math.floor((max - min) / max * 10000) / 100;
    avg["%PriceMax" + e] = Math.floor((max - filterData.at(-1).priceBasic) / max * 10000) / 100;
    avg["%PriceMin" + e] = Math.floor((min - filterData.at(-1).priceBasic) / min * 10000) / 100;
  });


  let shortPeriods = [5, 10, 20, 25, 26, 30, 50, 100, 200];
  let smaVol = shortPeriods.map(e => { return SMA.calculate({ period: e, values: vols }); });
  let smaRet = shortPeriods.map(e => { return SMA.calculate({ period: e, values: prices }); });

  shortPeriods.forEach((e, i) => {
    avg["sma" + e] = Math.floor(smaRet[i].at(-1) * 100) / 100;
    avg["sma" + e + "%"] = (Math.floor((prices.at(-1) - smaRet[i].at(-1)) / smaRet[i].at(-1) * 10000) / 100);
    avg["SVol" + e] = Math.floor(smaVol[i].at(-1) * 100) / 100;
    avg["%SVol" + e] = (Math.floor((vols.at(-1) - smaVol[i].at(-1)) / smaVol[i].at(-1) * 10000) / 100);
    avg["RSVol" + e] = (Math.floor(vols.at(-1) / smaVol[i].at(-1) * 100) / 100);
  })

  // console.table([avg])
  let keys = Object.keys(avg);
  // console.log(JSON.stringify(keys))
  let fix = ["symbol", "avgValue", "avgVol", "priceClose", "priceLow", "priceHigh", "priceOpen", "priceBasic", "pct", "ownership", "shares", "vol", "val", "OCP10", "OCP100", "OCP1000", "OCP15", "OCP20", "OCP200", "OCP3", "OCP30", "OCP365", "OCP500", "OCP7", "ORVal10", "ORVal100", "ORVal1000", "ORVal15", "ORVal20", "ORVal200", "ORVal3", "ORVal30", "ORVal365", "ORVal500", "ORVal7", "ORVol10", "ORVol100", "ORVol1000", "ORVol15", "ORVol20", "ORVol200", "ORVol3", "ORVol30", "ORVol365", "ORVol500", "ORVol7", "OVal10", "OVal100", "OVal1000", "OVal15", "OVal20", "OVal200", "OVal3", "OVal30", "OVal365", "OVal500", "OVal7", "OVol10", "OVol100", "OVol1000", "OVol15", "OVol20", "OVol200", "OVol3", "OVol30", "OVol365", "OVol500", "OVol7", "stdCP10", "stdCP100", "stdCP1000", "stdCP15", "stdCP20", "stdCP200", "stdCP3", "stdCP30", "stdCP365", "stdCP500", "stdCP7", "stdVal10", "stdVal100", "stdVal1000", "stdVal15", "stdVal20", "stdVal200", "stdVal3", "stdVal30", "stdVal365", "stdVal500", "stdVal7", "stdVol10", "stdVol100", "stdVol1000", "stdVol15", "stdVol20", "stdVol200", "stdVol3", "stdVol30", "stdVol365", "stdVol500", "stdVol7", "mean10", "mean100", "mean1000", "mean15", "mean20", "mean200", "mean3", "mean30", "mean365", "mean500", "mean7", "meanCP10", "meanCP100", "meanCP1000", "meanCP15", "meanCP20", "meanCP200", "meanCP3", "meanCP30", "meanCP365", "meanCP500", "meanCP7", "meanVal10", "meanVal100", "meanVal1000", "meanVal15", "meanVal20", "meanVal200", "meanVal3", "meanVal30", "meanVal365", "meanVal500", "meanVal7", "meanVol10", "meanVol100", "meanVol1000", "meanVol15", "meanVol20", "meanVol200", "meanVol3", "meanVol30", "meanVol365", "meanVol500", "meanVol7", "sma10", "sma10%", "sma100", "sma100%", "sma20", "sma20%", "sma200", "sma200%", "sma25", "sma25%", "sma26", "sma26%", "sma30", "sma30%", "sma5", "sma5%", "sma50", "sma50%", "std10", "std100", "std1000", "std15", "std20", "std200", "std3", "std30", "std365", "std500", "std7"]
  keys = keys.filter(e => !fix.includes(e));
  keys.sort();
  keys = [...fix, ...keys];
  let avgNew = {}
  keys.forEach(e => avgNew[e] = avg[e]);
  avg = avgNew;
  avg = { ...avg }
  // console.table([avg])

  summarySymbol[symbol] = avg;

  stat.res++;

  if (stat.res == stat.length) {
    resolve(summarySymbol);
  }

  if (stat.res % 10 == 0)
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

