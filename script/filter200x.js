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
import { Config } from "./config.js";
import { rejects } from "assert";
import { glob, globSync, globStream, globStreamSync, Glob } from 'glob'



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

let stockStore = {};
(() => {
  let data = fs.readFileSync('./profile/stock.json');
  let stockData = JSON.parse(data);
  stockData.forEach(e => {
    stockStore[e.Symbol] = e;
  })
  console.log("Loaded stockStore!")
})();



await (async function tradinginfo() {
  console.log("TradingInfo")
  let data = []
  if (fs.existsSync("./profile/tradinginfo.json")) {
    let json = fs.readFileSync("./profile/tradinginfo.json", "utf-8");
    data = JSON.parse(json);
  } else {
    let vndGetAllSymbols = await Exchange.vndGetAllSymbols();
    let symbolsVnd = vndGetAllSymbols.filter(s => { return s.code.length <= 3 }).map(e => { return e.code })
    let promise = [];
    let stat = { req: 0, res: 0, total: symbolsVnd.length }
    for (let s of symbolsVnd) {
      stat.req++;
      while (stat.req - stat.res >= 30) {
        await Exchange.wait(200)
      }
      let a = Exchange.VietStock.TradingInfo(s);
      promise.push(a);

      a.then(data => {
        stat.res++;
        // console.table(data)
        if (stat.res % 10 == 0) {
          console.log(stat)
        }
        promise.push(data);
      })
    }
    let a = await Promise.all(promise);
    data = [...promise]
    fs.writeFileSync("./profile/tradinginfo.json", JSON.stringify(promise));
  }

  data.forEach(e => {
    let m = stockStore[e.StockCode]
    if (m) {
      m["tradingInfo"] = e;
    }
  })

})()


let CK = ['BVS', 'AAS', 'BSI', 'FTS', 'HCM', 'AGR', 'EVS', 'DSC', 'SHS', 'CTS', 'SBS', 'APG', 'APS', 'BMS', 'MBS', 'PSI', 'ORS', 'VCI', 'TVB', 'TCI', 'SSI', 'VDS', 'VND', 'VIX', 'VIG', 'VFS']
let NH = ['NVB', 'NAB', 'HDB', 'SHB', 'LPB', 'CTG', 'MBB', 'BID', 'ACB', 'MSB', 'PGB', 'OCB', 'ABB', 'BVB', 'EIB', 'VIB', 'VCB', 'STB', 'SSB', 'VAB', 'TCB', 'VPB', 'TPB']
let BH = ['BMI', 'BVH', 'MIG', 'BIC']
await (async function BCTC() {
  console.log("BCTC")
  let data = []
  if (fs.existsSync("./profile/BCTC.json")) {
    let json = fs.readFileSync("./profile/BCTC.json", "utf-8");
    data = JSON.parse(json);
  } else {
    let vndGetAllSymbols = await Exchange.vndGetAllSymbols();
    // let symbolsVnd = vndGetAllSymbols.filter(s => { return s.code.length <= 3 }).map(e => { return e.code })
    let symbolsVnd = ['DDG', 'BII', 'BDT', 'DHM', 'DTI', 'ROS', 'IBC', 'SAB', 'BIG', 'GAS', 'NAG', 'NVB', 'AFX', 'VNM', 'BVH', 'PDV', 'HNG', 'MSN', 'FRT', 'NKG', 'SSB', 'VLB', 'FIR', 'LPB', 'HT1', 'PNJ', 'CTG', 'BCM', 'VSC', 'SJS', 'TGG', 'KSB', 'VRE', 'TCO', 'VPB', 'DVM', 'DPM', 'DRC', 'VCG', 'VC3', 'DAH', 'MWG', 'HSG', 'VPI', 'CST', 'VJC', 'PVL', 'PVT', 'DGC', 'EIB', 'HPX', 'GMD', 'AGG', 'MSB', 'HVN', 'SCG', 'BID', 'BVB', 'TDP', 'DGW', 'DCL', 'KPF', 'POM', 'SHI', 'HBC', 'VFS', 'REE', 'DHC', 'KVC', 'BMI', 'CTF', 'PSD', 'TC6', 'DCM', 'GSP', 'AMS', 'SJD', 'HHG', 'HHV', 'VIP', 'NBB', 'TNA', 'BCC', 'TCM', 'HAG', 'IDI', 'VCS', 'VTD', 'VHC', 'THT', 'TTB', 'VOC', 'BSR', 'VGT', 'HAX', 'VIC', 'KOS', 'BIC', 'MPC', 'IDC', 'CII', 'ACB', 'HCM', 'TNH', 'PC1', 'PLX', 'PDR', 'OIL', 'VND', 'CDC', 'PAN', 'POW', 'PPC', 'MBB', 'HCD', 'C69', 'VEA', 'PHR', 'LMH', 'VAB', 'TLG', 'PTL', 'LTG', 'HVH', 'KDH', 'IJC', 'LCG', 'VTO', 'TTA', 'DPG', 'TCB', 'SSH', 'NVL', 'ANV', 'VCB', 'GVR', 'LDG', 'QTP', 'FPT', 'HDB', 'PLC', 'TPB', 'PVS', 'VGI', 'HPG', 'TVD', 'CSV', 'CKG', 'DPR', 'AAT', 'ELC', 'VIB', 'GKM', 'APG', 'NT2', 'BFC', 'TNI', 'SHB', 'HUT', 'TNG', 'SBT', 'NHH', 'PGN', 'BNA', 'TNT', 'OCB', 'NBC', 'ST8', 'VNE', 'PVD', 'ITA', 'VLC', 'TDM', 'HDC', 'PLP', 'VCI', 'CNG', 'PVG', 'CTS', 'TDN', 'STB', 'SGP', 'PVP', 'BWE', 'PVB', 'CTR', 'SSI', 'LCM', 'GEG', 'C47', 'TAR', 'PVC', 'KDC', 'ITQ', 'D2D', 'PET', 'DDV', 'EVE', 'ASM', 'SZC', 'MBG', 'SJF', 'TIP', 'L14', 'DRI', 'TVN', 'MBS', 'CMX', 'HDG', 'CTI', 'NED', 'GEX', 'VPG', 'KBC', 'VGC', 'PTB', 'DRH', 'DBD', 'YEG', 'KHP', 'SIP', 'HAH', 'OGC', 'ADS', 'SCR', 'VOS', 'HAP', 'NHV', 'NLG', 'DXG', 'ABS', 'CEO', 'LHG', 'HTN', 'ABB', 'DST', 'SAM', 'CRE', 'VC2', 'AAV', 'C4G', 'DVG', 'DXS', 'MIG', 'NDN', 'AAS', 'BAF', 'CLX', 'TCI', 'NAF', 'NRC', 'LDP', 'SGR', 'TTF', 'STG', 'GIL', 'SHS', 'VHM', 'KHG', 'PAS', 'HD6', 'PGB', 'CSC', 'PFL', 'TLD', 'HHS', 'CEN', 'EVF', 'TTH', 'QNS', 'APH', 'AAA', 'VGS', 'SKG', 'TLH', 'HQC', 'AMV', 'HAR', 'FTS', 'TCH', 'PXL', 'AGM', 'NTL', 'NAB', 'PSI', 'EVS', 'TDC', 'SRA', 'FCN', 'BCG', 'CVN', 'CCL', 'DSC', 'LAS', 'TVB', 'TEG', 'VTP', 'VPH', 'BSI', 'LIG', 'TSC', 'BVS', 'ORS', 'MST', 'IPA', 'DLG', 'FID', 'ABC', 'DAG', 'DBC', 'HHP', 'HII', 'TV2', 'SMC', 'JVC', 'G36', 'S99', 'VHG', 'TIG', 'MSR', 'BMS', 'SBS', 'SDA', 'APS', 'QCG', 'PVX', 'PXS', 'NHA', 'VIG', 'ITC', 'AGR', 'TVC', 'API', 'VIX', 'TCD', 'EVG', 'IDJ', 'BMP', 'VC7', 'VDS', 'VNB', 'DIG', 'CTD', 'LSS', 'SCI', 'DL1', 'FIT', 'BOT', 'CIG', 'QBS', 'PSH', 'DTD']
    // let symbolsVnd = CK
    let promise = [];
    let stat = { req: 0, res: 0, total: symbolsVnd.length }
    for (let s of symbolsVnd) {
      stat.req++;
      while (stat.req - stat.res >= 50) {
        await Exchange.wait(200)
      }
      let a = {}
      if (!CK.includes(s)) {
        a = Exchange.CafeF.BCTC(s);
      } else {
        a = Exchange.CafeF.BCTC(s);
        // a = Exchange.CafeF.BCTCCK(s);
      }

      // promise.push(a);

      a.then(data => {
        stat.res++;
        // console.table(data)
        if (stat.res % 10 == 0) {
          console.log(stat)
        }
        promise.push(data);
      })
    }
    // let a = await Promise.all(promise);
    while (stat.req - stat.res > 0) {
      await Exchange.wait(200)
    }
    data = [...promise]
    fs.writeFileSync("./profile/BCTC.json", JSON.stringify(promise));
  }
  let c = 0;
  data.forEach(e => {
    let m = stockStore[e.code]
    if (m) {
      m["BCTC"] = e;
    }
    let ok = false;
    Object.keys(e.values).forEach(k => {
      // console.log(k,e.values[k])
      e.values[k].forEach(ee => {
        if (ee != '') {
          ok = true;
        }
      })

    })

    // if(!ok){console.log(c++,e.code)}
  })

})()


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

    if (stat2.req - stat2.res >= 2) {
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

  fs.writeFile("./profile/ratio.json", JSON.stringify(ratiosa), (e) => { });


  industry.forEach(e => {
    let ne = {};
    ne.industryCode = e.industryCode;
    ne.name = e.vietnameseName;
    mapIndustry[e.industryCode] = ne;
    e.codeList.split(",").forEach(s => { mapSymbol[s] = ne });
  }
  )

  // console.table(industry)
  // console.table(industryPE)
  // console.table(industryPB)
}


async function downloadReportFinancial() {
  console.log("Download")
  let vndGetAllSymbols = await Exchange.vndGetAllSymbols();
  let symbolsVnd = vndGetAllSymbols.filter(s => { return s.code.length <= 3 && s.status == 'listed' }).map(e => { return e.code })

  let stat2 = { req: 0, res: 0 };
  let queue = [...symbolsVnd];
  // let queue = ['VCT','TVP'];
  let ratiosa = []
  let all = [];
  while (true) {
    if (stat2.req - stat2.res >= 20) {
      await Exchange.wait(100);
      continue;
    }
    if (stat2.res % 10 == 0) {
      console.log(stat2, queue.length)
    }
    // queue.reverse();
    let symbol = queue.pop();
    if (symbol == undefined) {
      break;
    }
    stat2.req++;
    let ratios = Exchange.financialReportFireAnt(symbol);

    let p = ratios.then(res => {
      if (res.success)
        ratiosa.push(res)
      else
        queue.push(symbol)
      stat2.res++;

    });
    await p;
    all.push(p);
  }
  // await Exchange.wait(5000);
  await Promise.all(all);
  // while (stat2.req - stat2.res != 0) {
  //   await Exchange.wait(100);
  // }
  fs.writeFile("./profile/financial.json", JSON.stringify(ratiosa), (e) => { });
}

let shares = {}
async function ownership(list) {
  let promises = [];
  let stat = { req: 0, res: 0 }
  if (!fs.existsSync("./profile/holders.json")) {

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
    fs.writeFileSync("./profile/holders.json", JSON.stringify(all), (e) => { });
  } else {
    let json = fs.readFileSync("./profile/holders.json");
    let all = JSON.parse(new String(json))
    all.forEach(e => {
      shares[e.symbol] = e;
    })
  }
}
async function industry() {

  let vndGetAllSymbols = await Exchange.vndGetAllSymbols();

  let symbolsVnd = vndGetAllSymbols.filter(
    s => {
      return s.code.length <= 3 && s.status == 'listed'
    }).map(e => { return { code: e.code, floor: e.floor } })

  ownership(symbolsVnd.map(e => e.code))
  let industry = await Exchange.vndIndustryClassification();
  let industryPE = await Exchange.vndIndustryPE();
  let industryPB = await Exchange.vndIndustryPB();
  let mapSymbol = {};
  let mapIndustry = {};
  let pbe = {};
  // console.log("industry",industryPB,industryPE)
  if (industryPB != undefined)
    industryPB.forEach(e => { pbe[e.code] = { pb: e.value } })
  if (industryPE != undefined)
    industryPE.forEach(e => { pbe[e.code] = { ...pbe[e.code], pe: e.value } })

  // console.table(pbe)
  if (industry != undefined)
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
  let filterData = symbolRatio.map(e => { return { pb: e.PB, pe: e.PE, symbol: e.symbol, values: e.VONHOA, beta: e.BETA, sharesTotal: e.CPLH, cotuc: e.COTUC, roae: e.ROAE, roaa: e.ROAA, eps: e.EPS, freefloat: e.FREEFL } });
  // console.table(filterData);

  let ok = filterData.filter(e => {
    if (e.pb == undefined || e.pe == undefined) return true;

    let ne = mapSymbol[e.symbol];

    // if (ne.pb > e.pb && ne.pe > e.pe) {
    if(!ne)return true;
    e.industryCode = ne.industryCode;
    e.name = ne.name;
    e.ipb = ne.pb;
    e.ipe = ne.pe;
    return true;
    // }
    // return true;
  })

  let out = {};
  ok.forEach(e => { out[e.symbol] = e })
  // console.table(out)
  return out;
}

let mapFinancial = {};
async function financial() {
  let json = fs.readFileSync("./profile/financial.json");
  let financial = JSON.parse(new String(json))
  // console.table(financial[0])
  financial.forEach(
    e => {
      let et = {}
      // if( e.Q1 == null || e.Y1 == null || e.Y1.columns == undefined ||e.Q1.columns == undefined ) return;
      // if( e.Q2 == null || e.Y2 == null || e.Y2.columns == undefined ||e.Q2.columns == undefined ) return;

      // if(e.symbol == "HFX") console.log(e.Q1)
      mapFinancial[e.symbol] = et;
      let a = [];
      if (e.Q1 != null && e.Q1.columns != undefined) a.push(e.Q1)
      if (e.Q2 != null && e.Q2.columns != undefined) a.push(e.Q2)
      if (e.Y1 != null && e.Y1.columns != undefined) a.push(e.Y1)
      if (e.Y2 != null && e.Y2.columns != undefined) a.push(e.Y2)

      a.forEach(
        ae => {
          ae.columns.forEach(
            (k, i) => {
              if (i <= 1) return;
              for (let r = 0; r < ae.rows.length; r++) {
                et[ae.rows[r][1] + k] = ae.rows[r][i];
              }
            })
        }
      )
    }
  );

  let vndGetAllSymbols = await Exchange.vndGetAllSymbols();
  let symbolsVnd = vndGetAllSymbols.filter(s => { return s.code.length <= 3 && s.status == 'listed' }).map(e => { return e.code })


  symbolsVnd.forEach(e => {
    if (mapFinancial[e] == undefined) console.log(e)
  })

  console.log(symbolsVnd.length, Object.keys(mapFinancial).length)
}
let Q12023M = {}
async function Q12023() {

  let a = await fetch("https://api-finance-t19.24hmoney.vn/v2/web/companies/top-financial?device_id=web16693664wxvsjkxelc6e8oe325025&device_name=INVALID&device_model=Windows+10+NT+10.0&network_carrier=INVALID&connection_type=INVALID&os=Chrome&os_version=92.0.4515.131&access_token=INVALID&push_token=INVALID&locale=vi&browser_id=web16693664wxvsjkxelc6e8oe325025&key=profit_after_tax&sort=desc&page=1&per_page=2000", {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7",
      "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site"
    },
    "referrer": "https://24hmoney.vn/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  });

  let z = await a.json()

  z.data.data.forEach(e => {
    Q12023M[e.symbol] = { profit_change_percent: e.profit_change_percent, profit_after_tax: e.profit_after_tax }
  });

}
Q12023();

let busdm = {};
async function busd() {
  console.log("Load busd")
  let json = fs.readFileSync("./profile/busd.json", "utf8");
  let busd = JSON.parse(json)
  busd.forEach(e => {
    busdm[e.symbol] = e;
  })
}

busd();


let busdm2 = {}


async function busd2() {
  console.log("Load busd2")
  const jsfiles = await glob('./profile/busd_*.json', { ignore: 'profile/busd.json' })
  let mapFiles = {}
  let totalFiles = 0;


  jsfiles.forEach(
    e => {
      let date = e.slice(e.lastIndexOf("_") + 1, e.lastIndexOf("."))
      let strdate0 = date;
      let strdate = strdate0.slice(0, 4) + "-" + strdate0.slice(4, 6) + "-" + strdate0.slice(6);
      console.log(strdate)
      // let time = new Date(strdate).getTime()
      let json = fs.readFileSync(e, "utf8");
      let busd = JSON.parse(json)
      let m = {}
      busd.forEach(je => {
        m[je.symbol] = je;
      })
      busdm2[date] = m;

    }
  )

  console.table(Object.keys(busdm2))
}

busd2();

let tpcp = await Exchange.tpcp();
(async () => {

  var args = process.argv.slice(2);
  let vss = null;
  let checkdate = undefined;
  for (let v of args) {
    if (v.includes("download") || v.includes("financial") || v.includes("update"))
      vss = v;
    if (v.includes("checkdate="))
      checkdate = v;
    // break;
  }

  if (checkdate != undefined) {
    checkdate = +checkdate.substring("checkdate=".length);
  }

  ss = vss == null ? undefined : vss;

  if (ss != undefined && ss.includes("download")) {
    await download();
  }
  if (ss != undefined && ss.includes("financial")) {
    await downloadReportFinancial();
  }
  if (ss != undefined && ss.includes("update")) {
    if (fs.existsSync("./profile/holders.json"))
      fs.rmSync("./profile/holders.json")
  }

  let out = await industry();
  await financial();
  // let out = {}

  let company = [];
  let counter = 0;
  company = await Exchange.getlistallstock();
  let symbols = new Set();
  let mapSymbol = {}
  company.forEach((e) => {
    if (e.stock_code.length <= 3) {
      symbols.add(e.stock_code + "_" + e.post_to + "_trans.txt");
      mapSymbol[e.stock_code] = e.post_to;
    }
  })

  mapSymbol["VN30"] = "HOSE"
  mapSymbol["VNINDEX"] = "HOSE"


  let dir = "./his/";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  let files = fs.readdirSync(dir);
  let stat = { req: 0, res: 0 }

  files = files.filter(e => {
    let symbol = e.split("_")[0];
    return mapSymbol[symbol] != undefined;
  });

  // files = ["HPG_HOSE_trans.txt"]
  for (const file of files) {
    // if (symbols.has(file)) {
    stat.req++;
    // }
  }

  // console.log(files)

  let downloadDate = files[0].split("_")[2];
  // console.log(downloadDate);
  let date = new Date(+downloadDate);
  // console.log(date);

  var args = process.argv.slice(2);



  let promise = new Promise((resolve, reject) => {
    for (const file of files) {
      // if (symbols.has(file)) {
      loadData(path.join(dir, file).toString(), resolve, stat, out, mapSymbol, date, checkdate);
      // }
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

  dir = "./filter/";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // console.table(str)
  let floor = "HOSE";

  let y = date.getFullYear();
  let M = date.getMonth() + 1;
  let d = date.getDate();
  let h = date.getHours() + 7;
  let m = date.getMinutes();
  let s = date.getMilliseconds();

  let datestr = y + "" + (M < 10 ? "0" + M : M) + "" + d + "" + h + "" + m + "" + s;

  fs.writeFileSync(dir + "Filter" + "_table.log", str, (e) => { if (e) { console.log(e) } })
  fs.writeFileSync(dir + "Filter" + datestr + ".json", JSON.stringify(ret), (e) => { if (e) { console.log(e) } })

  let obj = Object.values(ret);
  obj.sort((a, b) => { return b["RVal10"] - a["RVal10"] });

  writeArrayJson2Xlsx(dir + "Filter" + datestr + ".xlsx", obj)
  console.log("Save to " + dir + "Filter" + datestr + ".xlsx")
  writeArrayJson2Xlsx(dir + "Foriegn" + datestr + ".xlsx", foriegnSummary)
  //Report nganh
  let report = {}
  let sum = { sectorName: e.SectorName, up: 0, down: 0, ref: 0, upVal: 0, downVal: 0, refVal: 0, upVol: 0, downVol: 0, refVol: 0, count: 0, val: 0, vol: 0, }
  obj.forEach(e => {
    if (e.SectorName == "" || e.SectorName == undefined) {
      // console.log(e.sectorName,e.sectorName == "" || e.sectorName == undefined)
      return;

    }
    if (!report[e.SectorName]) report[e.SectorName] = { sectorName: e.SectorName, up: 0, down: 0, ref: 0, upVal: 0, downVal: 0, refVal: 0, upVol: 0, downVol: 0, refVol: 0, count: 0, val: 0, vol: 0, }
    let r = report[e.SectorName];
    if (e.pct > 0) {
      r.up += 1;
      r.upVal += e.val;
      r.upVol += e.vol;

      sum.up += 1;
      sum.upVal += e.val;
      sum.upVol += e.vol;

    }
    if (e.pct < 0) {
      r.down += 1;
      r.downVal += e.val;
      r.downVol += e.vol;

      sum.down += 1;
      sum.downVal += e.val;
      sum.downVol += e.vol;
    }
    if (e.pct == 0) {
      r.ref += 1;
      r.refVal += e.val;
      r.refVol += e.vol;
      sum.ref += 1;
      sum.ref += e.val;
      sum.ref += e.vol;
    }

    r.count += 1;
    r.val += e.val;
    r.vol += e.vol;
    sum.count += 1;
    sum.val += e.val;
    sum.vol += e.vol;
  })

  let a = Object.values(report);
  let keys = Object.keys(sum);
  keys = keys.filter(e => e != 'sectorName')
  a.forEach(e => {
    keys.forEach(k => {
      e['%' + k] = Math.floor(e[k] / sum[k] * 100 * 100) / 100
    })
  })

  writeArrayJson2Xlsx(dir + "Nganh" + datestr + ".xlsx", a)

})();



let summarySymbol = {};
let foriegnSummary = []
async function loadData(path, resolve, stat, filter, mapSymbol, downloadDate, checkDate) {
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
    ne['dealValue'] = ne.totalValue - ne.putthroughValue
    return ne;
  })

  if (checkDate == undefined) checkDate = -1;

  let config = {
    avgValue: Config.filter()["avgValue"],
    avgVol: Config.filter()["avgVol"]
  }
  if (data.length == 0) return;

  let symbol = data[0].symbol;

  // let days = [3, 7, 10, 15, 20, 30, 50, 100, 200, 365, 500, 1000, 5000];
  let days = Config.filter()["days"];

  // let bombday = 10;
  let bombday = Config.filter()["bombday"];
  if (!days.includes(bombday)) days.push(bombday);
  days.sort((a, b) => {
    let t = a - b;
    return t < 0 ? -1 : t > 0 ? 1 : 0
  })
  let indexBombday = 0;
  for (let i = 0; i < days.length; i++) {
    if (days[i] == bombday) indexBombday = i;
  }
  let data30 = filterData.slice(0, 30);

  let datax = days.map(e => {
    let s = Math.min(e, filterData.length);
    return filterData.slice(0, s)
  });


  let sum = data30.reduce((a, b) => { return { dealVolume: (a.dealVolume + b.dealVolume), dealValue: (a.dealValue + b.dealValue) } }, { dealVolume: 0, dealValue: 0 })

  // console.log(sum)
  // console.table(data30[0])
  let avg = { symbol: symbol, avgValue: sum.dealValue / data30.length, avgVol: sum.dealVolume / data30.length };

  let pbe = filter[symbol];
  if (pbe != undefined) {
    avg = { ...avg, ...pbe }
  }

  let busdx = busdm[symbol];
  if (busdx) {
    avg.first = busdx.first
    avg.firstside = busdx.firstside
    avg.firstVal = busdx.firstVal
    avg.last = busdx.last
    avg.lastside = busdx.lastside
    avg.lastVal = busdx.lastVal
    avg.acum_busd_val = busdx.acum_busd_val;
    avg.acum_val = busdx.acum_val;
    avg['acum_val_bu'] = busdx.acum_val_bu;
    avg['acum_val_sd'] = busdx.acum_val_sd;
    avg['acum_vol_bu'] = busdx.acum_vol_bu;
    avg['acum_vol_sd'] = busdx.acum_vol_sd;
    avg['busdpval'] = busdx.busdpval;
  }

  Object.keys(busdm2).forEach(d => {

    let dx = busdm2[d];
    let bdx = dx[symbol];
    if (bdx) {
      // avg[d+'first'] = bdx.first
      // avg[d+'firstside'] = bdx.firstside
      // avg[d+'firstVal'] = bdx.firstVal
      // avg[d+'last'] = bdx.last
      // avg[d+'lastside'] = bdx.lastside
      // avg[d+'lastVal'] = bdx.lastVal
      avg[d + 'acum_busd_val'] = bdx.acum_busd_val;
      avg[d + 'acum_val'] = bdx.acum_val;
      avg[d + 'acum_val_bu'] = bdx.acum_val_bu;
      avg[d + 'acum_val_sd'] = bdx.acum_val_sd;
      avg[d + 'acum_vol_bu'] = bdx.acum_vol_bu;
      avg[d + 'acum_vol_sd'] = bdx.acum_vol_sd;
      avg[d + 'busdpval'] = bdx.busdpval;
    }
  })

  let q12023 = Q12023M[symbol];
  if (q12023) {
    avg['NetProfitQ12023'] = q12023.profit_after_tax;
    avg['NetProfitChangeQ12023'] = q12023.profit_change_percent;
  }
  if (stockStore[symbol]) {
    let tradingInfo = stockStore[symbol].tradingInfo;
    if (tradingInfo) {
      avg["StockStatus"] = tradingInfo.StockStatus;
      // console.table(tradingInfo)
      avg["bvps"] = tradingInfo.BVPS;
      avg["KLCPLH"] = tradingInfo.KLCPLH;
    }

    let bctc = stockStore[symbol].BCTC;

    if (bctc) {
      // console.log(bctc)
      let idx = -1;
      let f = async (h) => {
        let idx = -1;
        let i = 0;
        for (let e of h) {
          if (e.trim() == "Quý 1- 2023") {
            idx = i;
          }
          // if(symbol == "FCN")   
          // console.log("idxOUT",idx,e.trim() == "Quý 1- 2023",e.trim())  
          i++;
        }
        return idx;
      }

      idx = await f(bctc.head);

      if (symbol == "FCN") {
        // bctc.head.forEach((e,i)=>{console.log(i,e.trim(),e.trim()== "Quý 1- 2023")})
        // console.table(bctc.head)
        // console.log("idx", idx)
        // console.table(bctc.values)
      }

      if (idx < 0) idx = 4;

      if (idx > 0) {
        let k1 = "I. Tiền và các khoản tương đương tiền"
        let k2 = "II. Các khoản đầu tư tài chính ngắn hạn"
        if (bctc.values[k1]) {
          if (bctc.values[k1].length <= idx) {
          } else {
            avg["MI"] = bctc.values[k1][idx - 1].replaceAll(",", "")
            avg["MII"] = bctc.values[k2][idx - 1].replaceAll(",", "")
            if (!avg["MI"]) {
              avg["MI"] = bctc.values[k1][idx - 2].replaceAll(",", "")
              avg["MII"] = bctc.values[k2][idx - 2].replaceAll(",", "")
            }
            avg["MI"] = +avg["MI"]
            avg["MII"] = +avg["MII"]
            avg["MIII"] = avg["MII"] + avg["MI"]
          }
        }
      }
    }
  }

  avg.avgValue = Math.floor(avg.avgValue * 100) / 100
  avg.avgVol = Math.floor(avg.avgVol * 100) / 100
  avg.exch = mapSymbol[symbol];

  if (avg.avgValue < config.avgValue || avg.avgVol < config.avgVol) {
    stat.res++;
    if (stat.res == stat.req) {
      resolve(summarySymbol);
    }
    return;
  }
  filterData = filterData.reverse();
  let prices = filterData.map(e => e.priceClose);
  let pct = filterData.map(e => (e.priceClose - e.priceBasic) / e.priceBasic * 100).reverse().map(e => Math.floor(e * 100) / 100);
  let vols = filterData.map(e => e.dealVolume);

  avg.priceClose = Math.floor(prices.at(checkDate) * 100) / 100;
  avg.priceLow = Math.floor(filterData.at(checkDate).priceLow * 100) / 100;
  avg.priceHigh = Math.floor(filterData.at(checkDate).priceHigh * 100) / 100;
  avg.priceOpen = Math.floor(filterData.at(checkDate).priceOpen * 100) / 100;
  avg.priceBasic = Math.floor(filterData.at(checkDate).priceBasic * 100) / 100;
  avg.pct = Math.floor((filterData.at(checkDate).priceClose - filterData.at(checkDate).priceBasic) / filterData.at(checkDate).priceBasic * 10000) / 100
  avg.pctHC = Math.floor((filterData.at(checkDate).priceHigh - filterData.at(checkDate).priceClose) / filterData.at(checkDate).priceClose * 10000) / 100
  let os = shares[symbol];
  avg.ownership = os != undefined ? os.ownership : 0;
  avg.shares = os != undefined ? os.shares : 0;
  let h = days.map((e, i) => { return [...datax[i].map(e => e.priceHigh)] })
  let l = days.map((e, i) => { return [...datax[i].map(e => e.priceLow)] })
  let hl2 = days.map((e, i) => { return [...datax[i].map(e => e.priceHigh), ...datax[i].map(e => e.priceLow)] })
  let hl = days.map((e, i) => {
    let hl = [];
    let h = [...datax[i].map(e => e.priceHigh)]
    let l = [...datax[i].map(e => e.priceLow)]
    h.forEach((e, i) => {
      hl.push(e);
      hl.push(l[i]);
    })
    return hl;
  })
  let hlp = days.map((e, i) => {
    let hl = [];
    let h = [...datax[i].map(e => (e.priceHigh - e.priceBasic) * 100 / e.priceBasic)]
    let l = [...datax[i].map(e => (e.priceLow - e.priceBasic) * 100 / e.priceBasic)]
    h.forEach((e, i) => {
      hl.push(e);
      hl.push(l[i]);
    })
    return hl;
    //return [...datax[i].map(e => (e.priceHigh - e.priceBasic) * 100 / e.priceBasic), ...datax[i].map(e => (e.priceLow - e.priceBasic) * 100 / e.priceBasic)] 
  })
  let hlpp = days.map((e, i) => { return [...datax[i].map(e => (e.priceHigh - e.priceLow) * 100 / e.priceBasic)] })
  let c = days.map((e, i) => { return [...datax[i].map(e => e.priceClose)] })
  if (symbol == 'KBC')
    console.log(symbol, c.at(-1).slice(0, 100))
  let cpm = days.map((e, i) => {
    let aa = [...datax[i].map(e => e.priceClose)];
    let mean = aa.reduce((a, b) => a + b, 0) / aa.length;
    aa = aa.map(e => e / mean)
    return aa
  })
  let o = days.map((e, i) => { return [...datax[i].map(e => e.priceOpen)] })
  let b = days.map((e, i) => { return [...datax[i].map(e => e.priceBasic)] })
  let cp = days.map((e, i) => { return [...datax[i].map(e => (e.priceClose - e.priceBasic) * 100 / e.priceBasic)] })
  let vol = days.map((e, i) => { return [...datax[i].map(e => e.dealVolume)] })
  let putvol = days.map((e, i) => { return [...datax[i].map(e => e.putthroughVolume)] })
  let putval = days.map((e, i) => { return [...datax[i].map(e => e.putthroughValue)] })
  let tval = days.map((e, i) => { return [...datax[i].map(e => e.totalValue)] })
  let tvol = days.map((e, i) => { return [...datax[i].map(e => e.totalVolume)] })
  let val = days.map((e, i) => { return [...datax[i].map(e => (e.totalValue - e.putthroughValue))] })
  let BSL = days.map((e, i) => { return [...datax[i].map(e => e.buyCount)] })
  let BQ = days.map((e, i) => { return [...datax[i].map(e => e.buyQuantity)] })
  let SSL = days.map((e, i) => { return [...datax[i].map(e => e.sellCount)] })
  let SQ = days.map((e, i) => { return [...datax[i].map(e => e.sellQuantity)] })
  let BSSL = days.map((e, i) => { return [...datax[i].map(e => e.buyCount / e.sellCount)] })
  let BSQ = days.map((e, i) => { return [...datax[i].map(e => e.buyQuantity / e.sellQuantity)] })

  let Fvol = days.map((e, i) => { return [...datax[i].map(e => (e.buyForeignQuantity + e.sellForeignQuantity))] })
  let Fval = days.map((e, i) => { return [...datax[i].map(e => (e.buyForeignValue + e.sellForeignValue))] })
  let FvalDelta = days.map((e, i) => { return [...datax[i].map(e => (e.buyForeignValue - e.sellForeignValue))] })
  let FvolDelta = days.map((e, i) => { return [...datax[i].map(e => (e.buyForeignQuantity - e.sellForeignQuantity))] })
  let FBQ = days.map((e, i) => { return [...datax[i].map(e => e.buyForeignQuantity)] })
  let FSQ = days.map((e, i) => { return [...datax[i].map(e => e.sellForeignQuantity)] })
  let FBSQ = days.map((e, i) => { return [...datax[i].map(e => e.buyForeignQuantity / e.sellForeignQuantity)] })


  days.forEach((e, i) => {
    if (e == 50) {
      let day50 = datax[i];
      day50.forEach((de, ii) => {
        let fe = {}
        fe.symbol = de.symbol;
        fe.date = de.date;
        fe.dealVolume = de.dealVolume
        fe.dealValue = de.dealValue
        fe.totalVolume = de.totalVolume
        fe.totalValue = de.totalValue
        fe.Fvol = Fvol[i][ii]
        fe.Fval = Fval[i][ii]
        fe.FvalDelta = FvalDelta[i][ii]
        fe.FvolDelta = FvolDelta[i][ii]
        fe.FBV = de.buyForeignValue;
        fe.FSV = de.sellForeignValue;
        fe.FBQ = FBQ[i][ii]
        fe.FSQ = FSQ[i][ii]
        fe.FBSQ = FBSQ[i][ii]
        foriegnSummary.push(fe)
      })
    }
  })

  if (symbol == "TTF") console.table(FvalDelta[0])

  let m = {
    BSL: BSL,
    BQ: BQ,
    SSL: SSL,
    SQ: SQ,
    BSSL: BSSL,
    BSQ: BSQ,
    C: c,
    CPM: cpm,
    HL: hl,
    H: h,
    L: l,
    HL2: hl2,
    CP: cp,
    HLP: hlp,
    HLPP: hlpp,
    Vol: vol,
    Val: val,
    PVol: putvol,
    PVal: putval,
    TVol: tvol,
    TVal: tval,
    Fvol: Fvol,
    Fval: Fval,
    FvalDelta: FvalDelta,
    FvolDelta: FvolDelta,
    FBQ: FBQ,
    FSQ: FSQ,
    FBSQ: FBSQ,
  }

  let threshold = 1.645;
  avg.vol = filterData.at(checkDate).dealVolume;
  avg.val = filterData.at(checkDate).totalValue;

  let fn = mapFinancial[symbol];

  let date = new Date();


  if (fn != null) {
    Object.keys(fn).forEach(
      k => {
        if (k.includes(date.getFullYear())
          || k.includes(date.getFullYear() - 1)
          // || k.includes(date.getFullYear()-2)
        )
          avg[k] = fn[k];
      }
    )

  }

  Object.keys(m).forEach(
    me => {
      avg[me] = m[me][0].at(-1 - checkDate);
    }
  )
  let minEnd = Math.min(...hl.at(checkDate));

  let checkTime = new Date(filterData.at(checkDate).date);
  // console.log(checkTime, downloadDate)
  let ratioTrade = 1;


  if (checkTime.getFullYear() == downloadDate.getFullYear() &&
    checkTime.getMonth() == downloadDate.getMonth() &&
    checkTime.getDate() == downloadDate.getDate()) {
    let h = downloadDate.getHours() + 7;
    let m = downloadDate.getMinutes();
    let s = downloadDate.getMilliseconds();
    let totaltime = 0;
    let p1 = 9 * 60 * 60;
    let p2 = 11 * 60 * 60 + 30 * 60
    let p3 = 13 * 60 * 60
    let p4 = 14 * 60 * 60 + 45 * 60;
    let p5 = 15 * 60 * 60;

    // h = 15;
    // m = 47
    let p = h * 60 * 60 + m * 60 + s;
    let tradetime = 0;
    if (p >= p1 && p <= p2) tradetime = p - p1;
    if (p > p2 && p < p3) tradetime = p2 - p1;
    if (p >= p3 && p <= p4) tradetime = p2 - p1 + p - p3;
    if (p > p4 && avg.exch != "UPCOM") tradetime = p2 - p1 + p4 - p3;
    if (avg.exch == "UPCOM" && p > p4 && p <= p5) {
      tradetime = p2 - p1 + p - p3;
    }
    if (avg.exch == "UPCOM" && p > p5) {
      tradetime = p2 - p1 + p5 - p3;
    }
    let total = avg.exch == "UPCOM" ? p2 - p1 + p5 - p3 : p2 - p1 + p4 - p3;

    // if (avg.exch == "UPCOM") {
    //   console.log(total)
    //   console.log(h, m, s, tradetime, total, tradetime/total)
    // }else{
    //   // console.log(avg.exch,h, m, s, tradetime, total, tradetime/total)
    // }

    ratioTrade = tradetime / total;


  } else {
    ratioTrade = 1;
  }

  avg.predictVol = avg.vol / ratioTrade;
  avg.predictVal = avg.val / ratioTrade;

  // console.log(symbol,avg.vol,avg.predictVol,avg.val,avg.predictVal)

  // console.log(checkTime.getFullYear(), checkTime.getMonth(), checkTime.getDate())


  days.forEach((e, i) => {
    // avg["mean" + e] = Math.floor(stats.mean(c[i]) * 100) / 100;
    // avg["std" + e] = Math.floor(stats.stdev(c[i]) * 100) / 100;
    // avg["meanHL" + e] = Math.floor(stats.mean(hl[i]) * 100) / 100;
    // avg["stdHL" + e] = Math.floor(stats.stdev(hl[i]) * 100) / 100;
    // avg["meanHLP" + e] = Math.floor(stats.mean(hlp[i]) * 100) / 100;
    // avg["stdHLP" + e] = Math.floor(stats.stdev(hlp[i]) * 100) / 100;
    // avg["stdCP" + e] = Math.floor(stats.stdev(cp[i]) * 100) / 100;
    // avg["meanCP" + e] = Math.floor(stats.mean(cp[i]) * 100) / 100;
    // avg["meanVol" + e] = Math.floor(stats.mean(vol[i]) * 100) / 100;
    // avg["stdVol" + e] = Math.floor(stats.stdev(vol[i]) * 100) / 100;
    // if (symbol == "STB") console.log(i, e, stats.mean(vol[i]), vol[i].at(0), stats.stdev(vol[i]), Math.floor((Math.abs(stats.mean(vol[i]) - vol[i].at(0)) - threshold * stats.stdev(vol[i])) * 100) / 100)
    // avg["OVol" + e] = Math.floor((Math.abs(stats.mean(vol[i]) - vol[i].at(0)) - threshold * stats.stdev(vol[i])) * 100) / 100;
    // avg["meanVal" + e] = Math.floor(stats.mean(val[i]) * 100) / 100;
    // avg["stdVal" + e] = Math.floor(stats.mean(val[i]) * 100) / 100;
    // if (symbol == "STB") console.log(i, e, stats.mean(val[i]), val[i].at(0), stats.stdev(val[i]), Math.floor((Math.abs(stats.mean(val[i]) - val[i].at(0)) - threshold * stats.stdev(val[i])) * 100) / 100)
    // avg["OVal" + e] = Math.floor((Math.abs(stats.mean(val[i]) - val[i].at(0)) - threshold * stats.stdev(val[i])) * 100) / 100;
    // avg["OCP" + e] = Math.floor((Math.abs(stats.mean(cp[i]) - cp[i].at(0)) - threshold * stats.stdev(cp[i])) * 100) / 100;
    // avg["ORVol" + e] = Math.floor((Math.abs(stats.mean(vol[i]) - vol[i].at(0)) - threshold * stats.stdev(vol[i])) / Math.abs(stats.mean(vol[i])) * 100) / 100;
    // avg["ORVal" + e] = Math.floor((Math.abs(stats.mean(val[i]) - val[i].at(0)) - threshold * stats.stdev(val[i])) / Math.abs(stats.mean(val[i])) * 100) / 100;

    let exclude = ["C", "HL", "CP", "HLP"]
    Object.keys(m).forEach(
      me => {
        let mean = stats.mean(m[me][i])
        let std = stats.stdev(m[me][i])
        avg["mean" + me + e] = Math.floor(mean * 100) / 100;
        avg["std" + me + e] = Math.floor(std * 100) / 100;
        avg["stdR" + me + e] = Math.floor(std / Math.abs(mean) * 1000000) / 1000000;
        avg["stdM" + me + e] = Math.floor(std / minEnd * 1000000) / 1000000;
        // avg["stdMM" + me + e] = Math.floor(std * mean / minEnd * 1000000) / 1000000;
        avg["O" + me + e] = Math.floor((Math.abs(mean - m[me][i].at(-1 - checkDate)) - threshold * std) * 100) / 100;
        avg["ORR" + me + e] = Math.floor((Math.abs(mean - m[me][i].at(-1 - checkDate)) / std) * 100) / 100;
        avg["R" + me + e] = Math.floor((m[me][i].at(-1 - checkDate) / mean) * 100) / 100;
        if (i == indexBombday) {
          let t = [...m[me][i]];
          // console.log(...m[me][i],t,checkDate)
          t.splice(-1 - checkDate, 1);
          let bmax = Math.max(...t);
          // console.log(...m[me][i],t,bmax,checkDate)
          avg["MBR" + me + e] = Math.floor((bmax / mean) * 100) / 100;
        }
        let or = Math.floor((Math.abs(mean - m[me][i].at(-1 - checkDate)) - threshold * std) / Math.abs(mean) * 100) / 100;
        avg["OR" + me + e] = Number.isNaN(or) ? -999999 : or;
        // if(me == "HLPP") console.log(  avg["mean" + me + e] )
        if (exclude.includes(me)) {
          return;
        }
        avg["TO" + me + e] = Math.floor((Math.abs(mean - m[me][i].at(-1 - checkDate) / ratioTrade) - threshold * std) * 100) / 100;
        avg["TORR" + me + e] = Math.floor((Math.abs(mean - m[me][i].at(-1 - checkDate) / ratioTrade) / std) * 100) / 100;
        avg["TR" + me + e] = Math.floor((m[me][i].at(-1 - checkDate) / ratioTrade / mean) * 100) / 100;
        or = Math.floor((Math.abs(mean - m[me][i].at(-1 - checkDate) / ratioTrade) - threshold * std) / Math.abs(mean) * 100) / 100;
        avg["TOR" + me + e] = Number.isNaN(or) ? -999999 : or;
      }
    )

    let min = Math.min(...hl[i]);
    let max = Math.max(...hl[i]);
    avg["min" + e] = min;
    avg["max" + e] = max;
    avg["%MM" + e] = Math.floor((max - min) / max * 10000) / 100;
    avg["%MM2" + e] = Math.floor((max - min) / min * 10000) / 100;
    avg["%EE" + e] = Math.floor((filterData.at(checkDate).priceClose - c[i].at(checkDate)) / c[i].at(checkDate) * 10000) / 100;
    if (filterData.at(checkDate - 1))
      avg["EEC" + e] = Math.floor((filterData.at(checkDate - 1).priceClose - c[i].at(checkDate)) / c[i].at(checkDate) *
        (filterData.at(checkDate).priceClose - filterData.at(checkDate - 1).priceClose) / filterData.at(checkDate - 1).priceClose
        * 10000) / 100;
    avg["%PriceMax" + e] = Math.floor((max - filterData.at(checkDate).priceClose) / max * 10000) / 100;
    avg["%PriceMin" + e] = Math.floor((filterData.at(checkDate).priceClose - min) / min * 10000) / 100;

    let ci = c[i];
    let oi = o[i];
    let bi = b[i];
    let basicCount = 0;
    let openCount = 0;
    ci.forEach((e, ii) => {
      if (e >= bi[ii]) {
        basicCount++;
      }
      if (e >= oi[ii]) {
        openCount++;
      }
    })
    avg["basicC" + e] = basicCount;
    avg["openC" + e] = openCount;
  });


  // let shortPeriods = [5, 10, 20, 25, 26, 30, 50, 100, 200];
  let shortPeriods = Config.filter()["shortPeriods"];
  let smaVol = shortPeriods.map(e => { return SMA.calculate({ period: e, values: vols }); });
  let smaRet = shortPeriods.map(e => { return SMA.calculate({ period: e, values: prices }); });
  let numSidewayDays = Config.filter()["numSidewayDays"];
  let numCheckIncrementDays = Config.filter()["numCheckIncrementDays"];
  let windowCheckIncrement = Config.filter()["windowCheckIncrement"];
  let shortSidewayDays = Config.filter()["shortSidewayDays"];
  let shortCeDays = Config.filter()["shortCeDays"];
  let cepct = Config.filter()["cepct"];
  let t = [...prices];
  t.reverse();
  let xc = t.slice(0, numCheckIncrementDays);
  xc.reverse();
  let maxWMM = 0;
  let maxWEE = 0
  let mae = [];
  let mam = [];
  xc.forEach((e, i) => {
    let ta = xc.slice(i, i + windowCheckIncrement)
    let min = Math.min(...ta);
    let max = Math.max(...ta);
    let pwMM = Math.floor((max - min) / min * 10000) / 100
    if (maxWMM < pwMM) maxWMM = pwMM;
    let pwEE = Math.floor((ta.at(-1) - ta[0]) / ta[0] * 10000) / 100
    if (maxWEE < pwEE) maxWEE = pwEE;
    mae.push(pwEE)
    mam.push(pwMM)
    // console.log(maxWEE,maxWMM) 
    // if(symbol == "NHV")
    // console.log(symbol,ta)
  })


  let x = t.slice(0, numSidewayDays);
  let mean = stats.mean(t.slice(0, shortSidewayDays))
  let std = stats.stdev(t.slice(0, shortSidewayDays))
  let sidewayThreshold = 2;
  let count = 0;
  let countUP = 0;
  let countUPMean = 0;
  let countUPMean2 = 0;
  let countDown = 0;
  let countVol = 0;
  let countVolMean = 0;
  let countCeCont = 0;
  let countCe = 0;
  let countFlo = 0;
  let maxCountCe = 0;
  let lastCe = 0;
  x.forEach(e => {
    if (Math.abs(e - mean) / mean * 100 < sidewayThreshold) {
      count++;
    }
  });

  x.every((e, i) => {
    if (i < x.length - 1)
      if (e >= x[i + 1]) { countUP++; return true }
      else
        return false;
    return false;
  })
  x.every((e, i) => {
    if (i < x.length - 1)
      if (e >= mean) { countUPMean++; return true }
      else
        return false;
    return false;
  })

  x.slice(0, shortSidewayDays).every((e, i) => {
    if (i < x.length - 1)
      if (e >= mean) { countUPMean2++; return true }
      else
        return false;
    return false;
  })
  // console.log(symbol)
  // console.table(pct.slice(0, shortCeDays))
  let tmpCe = 0;

  let doneLastCe = false;
  pct.slice(0, shortCeDays).every((e, i) => {
    if (e >= cepct) { tmpCe++; if (maxCountCe < tmpCe) maxCountCe = tmpCe }
    else {
      tmpCe = 0;
    }
    if (e <= cepct && !doneLastCe) { lastCe++ } else {
      doneLastCe = true;
    }

    if (e >= cepct) { countCe++; return true }
    else
      return true;
    return true;
  })

  pct.slice(0, shortCeDays).every((e, i) => {
    if (e <= -cepct) { countFlo++; return true }
    else
      return true;
    return true;
  })

  pct.slice(0, shortCeDays).every((e, i) => {
    if (e >= cepct) { countCeCont++; return true }
    else
      return false;
    return false;
  })

  x.every((e, i) => {
    if (i < x.length - 1)
      if (e < x[i + 1]) { countDown++; return true }
      else
        return false;
    return false;
  })

  let v = [...vols];
  v.reverse();
  v = v.slice(0, shortSidewayDays);
  // v.reverse();
  let meanVol = stats.mean(v);
  v.every((e, i) => {
    if (i == 0) return true;
    if (i < v.length - 1)
      if (e >= v[i + 1] && e > meanVol) { countVol++; return true }
      else
        return false;
    return false;
  })

  v.every((e, i) => {
    if (i == 0) return true;
    if (i < v.length - 1)
      if (e > meanVol) { countVolMean++; return true }
      else
        return false;
    return false;
  })

  // console.log(symbol, v)
  avg["SWC"] = count;
  avg["UP"] = countUP;
  avg["UPMean"] = countUPMean;
  avg["UPMeanAll"] = countUPMean2;
  avg["DOWN"] = countDown;
  avg["CountVol"] = countVol;
  avg["countVolMean"] = countVolMean;
  avg["countCe"] = countCe;
  avg["countFlo"] = countFlo;
  avg["countCeCont"] = countCeCont;
  avg["MaxcountCe"] = maxCountCe;
  avg["MaxWMM"] = maxWMM;
  avg["MaxWEE"] = maxWEE;
  avg["aMaxWEE"] = stats.mean(mae);
  avg["aMaxWMM"] = stats.mean(mam);
  avg["lastCe"] = lastCe;

  shortPeriods.forEach((e, i) => {
    avg["sma" + e] = Math.floor(smaRet[i].at(checkDate) * 100) / 100;
    avg["sma" + e + "%"] = (Math.floor((prices.at(checkDate) - smaRet[i].at(checkDate)) / smaRet[i].at(checkDate) * 10000) / 100);
    avg["SVol" + e] = Math.floor(smaVol[i].at(checkDate) * 100) / 100;
    avg["%SVol" + e] = (Math.floor((vols.at(checkDate) - smaVol[i].at(checkDate)) / smaVol[i].at(checkDate) * 10000) / 100);
    avg["RSVol" + e] = (Math.floor(vols.at(checkDate) / smaVol[i].at(checkDate) * 100) / 100);

    if (e == 200) {
      if (prices.at(checkDate) - smaRet[i].at(checkDate) > 0) {
        for (let ii = 1; ii < prices.length; ii++) {
          if (prices.at(-ii) > smaRet[i].at(-ii) && prices.at(-ii - 1) < smaRet[i].at(-ii - 1)) {
            // console.log(symbol,prices.at(-ii),smaRet[i].at(-ii),prices.at(-ii-1),smaRet[i].at(-ii-1))
            avg["smacut" + e] = smaRet[i].at(-ii)
            avg["pricesmacut" + e] = prices.at(-ii)
            avg["smacuti" + e] = ii
            avg["smacut" + e + "%"] = (Math.floor((prices.at(checkDate) - smaRet[i].at(-ii)) / smaRet[i].at(-ii) * 10000) / 100);
            avg["smacutp" + e + "%"] = (Math.floor((prices.at(checkDate) - prices.at(-ii)) / prices.at(-ii) * 10000) / 100);
            break;
          }
        }
      }
    }
  })


  avg["RSVol" + shortPeriods[0] + "/" + shortPeriods[1]] = smaVol[0].at(checkDate) / smaVol[1].at(checkDate)
  avg["RSVol" + shortPeriods[0] + "/" + shortPeriods[2]] = smaVol[0].at(checkDate) / smaVol[2].at(checkDate)
  avg["RSVol" + shortPeriods[0] + "/" + shortPeriods.at(-1)] = smaVol[0].at(checkDate) / smaVol.at(-1).at(checkDate)

  var inputRSI = {
    values: prices,
    period: 14
  };


  var rsi = RSI.calculate(inputRSI);
  avg.rsi = rsi.at(checkDate)

  const bb = { period: 20, stdDev: 2, values: prices };
  const macd = { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, values: prices, };
  const stochasticRsi = { stochasticPeriod: 14, rsiPeriod: 14, period: 14, kPeriod: 3, dPeriod: 3 };
  // const mfi = { period: 14 , values: prices, };
  // const rsi = { period: 14 , values: prices,}

  var bbo = BollingerBands.calculate(bb);
  var macdo = MACD.calculate(macd);
  // var srsio = StochasticRSI.calculate(stochasticRsi);
  // console.table(bbo.slice(0,10))
  // console.table(macdo.slice(0,10))
  let bbe = bbo.at(checkDate);
  let macde = macdo.at(checkDate);
  // console.log(symbol)
  // console.table([bbe])
  // console.table([macde])
  if (bbe)
    Object.keys(bbe).forEach(e => {
      avg["BB" + e] = bbe[e];
    })
  if (macde)
    Object.keys(macde).forEach(e => {
      avg["MACD" + e] = macde[e];
    })

  let tp = tpcp[symbol]
  if (tp != undefined) avg["tpcp"] = tp;
  // console.table([avg])
  let keys = Object.keys(avg);
  // console.log(JSON.stringify(keys))
  if (stockStore[symbol] != undefined) {
    avg["Company"] = stockStore[symbol].Company;
    avg["SectorName"] = stockStore[symbol].SectorName;
  }


  let fix = ["symbol", "exch", "tpcp", "name", "SectorName", "Company", "avgValue", "avgVol", "priceClose", "priceLow", "priceHigh", "priceOpen", "priceBasic", "pct", "vol", "val", "%PriceMin3", "%PriceMin10", "NetProfitQ1/2023", "NetProfitQ4/2022", "NetProfit2022", "Liability2022", "Equity2022", "ownership", "shares", "OCP10", "OCP100", "OCP1000", "OCP15", "OCP20", "OCP200", "OCP3", "OCP30", "OCP365", "OCP500", "OCP7", "ORVal10", "ORVal100", "ORVal1000", "ORVal15", "ORVal20", "ORVal200", "ORVal3", "ORVal30", "ORVal365", "ORVal500", "ORVal7", "ORVol10", "ORVol100", "ORVol1000", "ORVol15", "ORVol20", "ORVol200", "ORVol3", "ORVol30", "ORVol365", "ORVol500", "ORVol7", "OVal10", "OVal100", "OVal1000", "OVal15", "OVal20", "OVal200", "OVal3", "OVal30", "OVal365", "OVal500", "OVal7", "OVol10", "OVol100", "OVol1000", "OVol15", "OVol20", "OVol200", "OVol3", "OVol30", "OVol365", "OVol500", "OVol7", "stdCP10", "stdCP100", "stdCP1000", "stdCP15", "stdCP20", "stdCP200", "stdCP3", "stdCP30", "stdCP365", "stdCP500", "stdCP7", "stdVal10", "stdVal100", "stdVal1000", "stdVal15", "stdVal20", "stdVal200", "stdVal3", "stdVal30", "stdVal365", "stdVal500", "stdVal7", "stdVol10", "stdVol100", "stdVol1000", "stdVol15", "stdVol20", "stdVol200", "stdVol3", "stdVol30", "stdVol365", "stdVol500", "stdVol7", "mean10", "mean100", "mean1000", "mean15", "mean20", "mean200", "mean3", "mean30", "mean365", "mean500", "mean7", "meanCP10", "meanCP100", "meanCP1000", "meanCP15", "meanCP20", "meanCP200", "meanCP3", "meanCP30", "meanCP365", "meanCP500", "meanCP7", "meanVal10", "meanVal100", "meanVal1000", "meanVal15", "meanVal20", "meanVal200", "meanVal3", "meanVal30", "meanVal365", "meanVal500", "meanVal7", "meanVol10", "meanVol100", "meanVol1000", "meanVol15", "meanVol20", "meanVol200", "meanVol3", "meanVol30", "meanVol365", "meanVol500", "meanVol7", "sma10", "sma10%", "sma100", "sma100%", "sma20", "sma20%", "sma200", "sma200%", "sma25", "sma25%", "sma26", "sma26%", "sma30", "sma30%", "sma5", "sma5%", "sma50", "sma50%", "std10", "std100", "std1000", "std15", "std20", "std200", "std3", "std30", "std365", "std500", "std7"]
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

  if (stat.res == stat.req) {
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

