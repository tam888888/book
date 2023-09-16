import fetch from "node-fetch";
import fs from "fs";
import log4js from "log4js";
import { Parser } from "json2csv"
import path from "path";
import http from "node:http";
import https from "node:https";
import { Exchange } from "./Exchange.js";
var logger = log4js.getLogger();
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
const agent = (_parsedURL) => _parsedURL.protocol == 'http:' ? httpAgent : httpsAgent;

log4js.configure({
  appenders: {
    everything: { type: "file", filename: "diem.log" },
    console: { type: "console" },
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
  let ssiSymbol = await Exchange.SSI.getlistallsymbol();
  let ssiCop = ssiSymbol.filter(e => { return e.stockSymbol.length == 3 }).map(e => { return { stock_code: e.stockSymbol } });
  console.table(ssiSymbol.length)
  console.table(ssiCop.length)
  var args = process.argv.slice(2);
  let vss = null;
  for (let v of args) {
    if (v.includes("stock="))
      vss = v;
    break;
  }
  let ss = vss == null ? "24HMONEY" : vss.substring("stock=".length);

  let cop = [];

  let requested = 0;
  let responsed = 0;
  let csv = new Parser({ fields: ['Stockcode', 'Package', 'TradingDate', 'Price', 'Vol', 'TotalVol', 'TotalVal', 'Change', 'IsBuy', 'PerChange'] });
  cop = await getlistallstock();
  let watchlist = ['HPG', 'DCM', 'HSG', 'NKG', 'VIX', 'SHS'];

  let total_check = 0;
  for (let x of cop) {
    if (x.stock_code.length < 4) {
      total_check++;
    }
  }

  getliststockdata(cop, stockdata);
  try {
    let localReq = 0;
    let localRes = 0;
    logger.info("Checking", requested, responsed)
    let t1 = Date.now();
    let dir = "/workspace/newstorage/";
    let dir2 = "./trans";
    let csv = null;
    let fun = () => { }
    switch (ss.toUpperCase()) {
      case "24HMONEY":
        dir += "./trans/" + getNow() + "/";
        csv = new Parser({ fields: ['price', 'change', 'match_qtty', 'side', 'time', 'total_vol'] });
        fun = getTrans;
        break;
      case "VIETSTOCK":
        dir += "./vietstocktrans/" + getNow() + "/";
        csv = new Parser({ fields: ['Stockcode', 'Package', 'TradingDate', 'Price', 'Vol', 'TotalVol', 'TotalVal', 'Change', 'IsBuy', 'PerChange'] });
        fun = Exchange.VietStock.GetStockDealDetail;
        break;
      case "SSI":
        dir += "./ssitrans/" + getNow() + "/";
        csv = new Parser({ fields: ["stockNo", "price", "vol", "accumulatedVol", "time", "ref", "side", "priceChange", "priceChangePercent", "changeType", "__typename"] });
        fun = Exchange.SSI.graphql;
        dir2 = "./trans/" + getNow() + "/";
        if (!fs.existsSync(dir2)) {
          fs.mkdirSync(dir2, { recursive: true });
        } else {
          let files = fs.readdirSync(dir2);
          for (const file of files) {
            fs.unlinkSync(path.join(dir2, file));
          }
        }
        break;
      case "TCBS":
        dir += "./tcbstrans/" + getNow() + "/";
        csv = new Parser({ fields: ["p", "v", "cp", "rcp", "a", "ba", "sa", "hl", "pcp", "t"] });
        fun = Exchange.TCBS.intraday;
        break;
      case "VCI":
        dir += "./vcitrans/" + getNow() + "/";
        csv = new Parser({ fields: ["id", "symbol", "truncTime", "matchType", "matchVol", "matchPrice", "accumulatedVolume", "createdAt", "updatedAt"] });
        fun = Exchange.VCI.getAll;
        break;
      case "VCBS":
        dir += "./vcbstrans/" + getNow() + "/";
        csv = new Parser({ fields: ['symbol', 'time', 'price', 'change', 'vol', 'total', 'side'] });
        fun = Exchange.VCBS.priceBoard;
        break;
      case "CAFEF":
        dir += "./cafeftrans/" + getNow() + "/";
        // csv = new Parser({ fields: ['symbol', 'ThoiGian','Gia','GiaThayDoi','KLLo','KLTichLuy','TiTrong','KLLoN','change'] });
        csv = new Parser({ fields: ['price', 'change', 'match_qtty', 'side', 'time', 'total_vol'] });
        fun = Exchange.CafeF.DataHistory;
        break;
    }

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    } else {
      let files = fs.readdirSync(dir);
      for (const file of files) {
        fs.unlinkSync(path.join(dir, file));
      }
    }
    let maxSize = 100;
    if (ss.toUpperCase() == "TCBS") maxSize = 50

    logger.debug("Done remove directory ", dir);

    let stat = { req: 0, res: 0, record: 0 }
    cop = ssiCop;
    total_check = cop.length;
    for (let x of cop) {
      x['Code'] = x.stock_code;
      if (x.Code.length < 4) {
        logger.trace(x.Code);
        while (stat.req - stat.res >= maxSize) {
          await wait(200);
        }
        // let z = getTrans(x.Code);
        // let z = Exchange.VietStock.GetStockDealDetail(x.Code);
        // console.log(x.Code)
        stat.req++;
        let z = fun(x.Code);
        requested++;
        localReq++;
        z.then((ret) => {
          stat.res++;
          if (stat.res % 10 == 0) {
            console.log(stat)
          }
          responsed++;
          localRes++;
          if (logger.isTraceEnabled)
            logger.trace(ret.data.length);

          if (localRes == total_check) {
            logger.info("Done " + getNow() + " " + (Date.now() - t1) / 1000 + " ms");
          }
          if (ret.data.length == 0) {
            return;
          }

          stat.record += ret.data.length;

          // 
          let data2 = csv.parse(ret.data);
          if (watchlist.includes(ret.Code)) {
            // logger.info("\n",ret.Code,"\n",data2.substr(0,data2.indexOf("\n",200)));
          }
          switch (ss.toUpperCase()) {
            case "SSI":
              // csv = new Parser({ fields: ['price', 'change', 'match_qtty', 'side', 'time', 'total_vol'] });
              // csv = new Parser({ fields: ["stockNo", "price", "vol", "accumulatedVol", "time", "ref", "side", "priceChange", "priceChangePercent", "changeType", "__typename"] });
              let newData = ret.data.map(e => {
                let ne = { price: e.price, change: e.priceChange, match_qtty: e.vol, side: e.side, time: e.time, total_vol: e.accumulatedVol };
                // console.log(ne)
                return ne;
              })
              fs.appendFileSync(dir + ret.Code + '_trans.txt', data2 + "\n", function (err) {
                if (err) throw err;
              });
              fs.appendFileSync(dir + ret.Code + '_stockRealtime.json', JSON.stringify(ret.stockRealtime) + "\n", function (err) {
                if (err) throw err;
              });

              let csv2 = new Parser({ fields: ['price', 'change', 'match_qtty', 'side', 'time', 'total_vol'] });
              let newData2 = csv2.parse(newData);
              fs.appendFileSync(dir2 + ret.Code + '_trans.txt', newData2 + "\n", function (err) {
                if (err) throw err;
              });
              break;
            default:
              fs.appendFile(dir + ret.Code + '_trans.txt', data2 + "\n", function (err) {
                if (err) throw err;
              });
          }

        })
      }
    }
  } catch (error) {
    logger.error(error);
  } finally {
    await wait(1000);
  }
})();

function summary(sum, data) {
  for (let e of data) {
    sum['total_vol'] += e.match_qtty;
    sum['total_val'] += e.match_qtty * e.price;
    switch (e.side) {
      case "bu":
        sum['bu'] += e.match_qtty;
        break;
      case "sd":
        sum['sd'] += e.match_qtty;
        break;
      default:
        sum['other'] += e.match_qtty;
    }
  }
  if (data.length > 0) {
    sum['total_vol2'] += data[0].total_vol;
  }
}

function summarySum(sum, add) {
  sum['total_vol'] += add['total_vol'];
  sum['total_val'] += add['total_val']
  sum['bu'] += add['bu']
  sum['sd'] += add['sd']
  sum['other'] += add['other']
  sum['total_vol2'] += add['total_vol2']

}
function summarySymbol(sum, data) {
  for (let e of data) {
    sum['total_vol'] += e.match_qtty;
    sum['total_val'] += e.match_qtty * e.price;
    switch (e.side) {
      case "bu":
        sum['bu'] += e.match_qtty;
        break;
      case "sd":
        sum['sd'] += e.match_qtty;
        break;
      default:
        sum['other'] += e.match_qtty;
    }
  }

  if (data.length > 0) {
    sum['total_vol2'] += data[0].total_vol;
    let price = stockdata[sum.symbol];

    if (price != undefined && data[0].price == price.c && sum.total_vol > 10000) {
      // console.log(sum, price.c , data[0]);
    }

    if (price != undefined) {
      let ratio = (price.lastPrice - price.r) * 100 / price.r;
      let set = checkSymbol[Math.round(ratio)];
      if (set == null || set == undefined) {
        set = new Set();
        checkSymbol[Math.round(ratio)] = set;
      }
      set.add([sum.symbol, formater.format(ratio), sum.total_vol]);
    }

  }

  if ((sum.bu > 1.2 * sum.sd) && sum.total_vol > 200000) {
    // console.log(sum.symbol, sum.bu, sum.sd, sum.total_vol, data[0].price)
  }
}

function getNow() {
  let fd = new Date();
  return fd.getFullYear()
    + "" + (fd.getMonth() + 1 < 10 ? "0" + (fd.getMonth() + 1) : fd.getMonth() + 1)
    + "" + (fd.getDate() < 10 ? "0" + fd.getDate() : fd.getDate());
}

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(0);
    }, ms);
  });
}

async function getTrans(symbol) {
  let a = await fetch("https://api-finance-t19.24hmoney.vn/v1/web/stock/transaction-list-ssi?device_id=web&device_name=INVALID&device_model=Windows+10&network_carrier=INVALID&connection_type=INVALID&os=Chrome&os_version=92.0.4515.131&app_version=INVALID&access_token=INVALID&push_token=INVALID&locale=vi&browser_id=web16693664wxvsjkxelc6e8oe325025&symbol=" + symbol + "&page=1&per_page=2000000", {
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
    "mode": "cors",
    agent,
  }, { timeout: 1000 });
  let x = await a.json();
  x["Code"] = symbol;
  return x;

}

async function getlistallstock() {
  let cop = [];
  // process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
  let fet = await fetch("https://bgapidatafeed.vps.com.vn/getlistallstock", {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7",
      "if-none-match": "W/\"5ac92-c+NqjXQ6D2JFKgaxgUoTpIzr5z8\"",
      "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site"
    },
    "referrer": "https://banggia.vps.com.vn/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  }, { timeout: 5000 });
  let xx = await fet.json();
  // process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
  console.log(xx.length)
  cop = [...cop, ...xx];
  return cop;
}


async function getCoporate() {
  for (let i = 1; i < 1; i++) {
    let a = await fetch("https://finance.vietstock.vn/data/corporateaz", {
      "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "cookie": "_ga=GA1.2.70802173.1668475499; _cc_id=bd4b49a4b7a58cfaeb38724516b82171; language=vi-VN; Theme=Light; dable_uid=35370669.1668475569175; dable_uid=35370669.1668475569175; AnonymousNotification=; __gads=ID=af0897d5e697b47b-2219cdf973d800fc:T=1668475507:S=ALNI_MaL0TTHW6nK5yq36h7SKojzDZdS3w; _gid=GA1.2.628877579.1669284322; __gpi=UID=00000b7c20f7c81e:T=1668475507:RT=1669284333:S=ALNI_MbZNgtWTtbRI1MrLcfM5qFq0RIBMQ; panoramaId_expiry=1669370736071; ASP.NET_SessionId=qduvvnqyivh5d4wxgbuml2i4; __RequestVerificationToken=DMLOwjnmuA56MS_Ww2aeEeYKVOqgXC8AokvPdtt4rab-ZCwmqqnVntOncwKpiUMztm716730yD0Ww2wOYftsmgR2LZRIlLaxTIwizl5AHYw1; cto_bundle=Vwxihl9GalVXbDclMkJNeHNwS0pTN0VtbThsUHg3czZzMmJRak9lYW1PckQlMkJlbHZycjlJQTZyUEQ5SVJEZVV0MDV0TnhyYUExTVlGQnljTFVlNDYzJTJGQjVRckZINGtiJTJCYklyWWZSUHRWMWdyVzZ5aVUxMFNsTGxsMENEJTJGekJkdGQybURpMVZaWmlRT1VLRjBmeWRpTldWUW1mdElnJTNEJTNE; vts_usr_lg=FCD52B81DB78650855CAA7CA28FA7C8EDE83A4C07B4D82FF93CB56D4548635D5DDB6EE0FA4C44D0AA886E67E128BE9D4CFD90FFCDD22AE564370A2F149D63A93A693B03B648319091F8447195028A2E131176E743B4A7A2812875BFA74F81A6CE42BB7BB98BF8D02534A1AF82170658BB9C71CA8F0E53D047C661E38E30A2590; vst_usr_lg_token=GkYVXcco60+DaHbLnHxDcw=="
      },
      "referrer": "https://finance.vietstock.vn/doanh-nghiep-a-z?page=0",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": "catID=0&industryID=0&page=3&pageSize=1000&type=0&code=&businessTypeID=0&orderBy=Code&orderDir=ASC&__RequestVerificationToken=OG2V3lTnmB0D7vZLkd9pAilFPditBUL6KpJk7C4Fa2-V0LLJuTOgsHRCOyFMXiqz17v8zJfkTNd0K8HGetRIYr1LLGi0hfCIxLSyEJGoG6AvXJeCRtV1ni_2fMEBgh8A0",
      "method": "POST",
      "mode": "cors"
    });

    let x = await a.json();
    cop = [...cop, ...x]
    console.log(x.length, " ", i)
  }
  console.log(cop.length)
  let data = JSON.stringify(cop);
  // fs.writeFileSync('cop.json', data);
  let result = data.includes("\"");
  console.log("result ", result)

}


function loadCoporate() {
  fs.readFile('cop.json', (err, data) => {
    if (err) throw err;
    cop = JSON.parse(data);
  });
  data = fs.readFileSync('cop.json');
  cop = JSON.parse(data);
  console.log(cop.length);
}

async function getliststockdata(list, ret) {
  let maxURLLength = 2048;
  // process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
  let url = "https://bgapidatafeed.vps.com.vn/getliststockdata/";

  for (let i = 0; i < list.length; i++) {
    url = url + list[i].stock_code + ",";
    if (url.length > 2024 || i == list.length - 1) {
      url.slice(0, -1);
      let a = fetch(url, {
        "headers": {
          "accept": "application/json, text/plain, */*",
          "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7",
          "cache-control": "max-age=0",
          "if-none-match": "W/\"4d40-JGO04TIpDa6yRnuWE3iB61BlloY\"",
          "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
          "sec-ch-ua-mobile": "?0",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "cookie": "_fbp=fb.2.1669623965921.1893403188; _ga_M9VTXEHK9C=GS1.1.1669958644.2.0.1669958644.0.0.0; _gid=GA1.3.658451143.1670224721; _ga=GA1.1.1812813168.1668398014; _ga_4WDBKERLGC=GS1.1.1670316124.25.0.1670316124.0.0.0; _ga_QW53DJZL1X=GS1.1.1670384164.2.1.1670384195.0.0.0; _ga_790K9595DC=GS1.1.1670384139.11.1.1670384402.0.0.0"
        },
        "referrer": "https://bgapidatafeed.vps.com.vn/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors"
      });
      a.then(res => res.json()).then(data => {
        for (let e of data) {
          ret[e.sym] = e;
        }
      });
      url = "https://bgapidatafeed.vps.com.vn/getliststockdata/";
    }
  }
  // process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
}

