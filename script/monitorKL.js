import fetch from "node-fetch";
import fs from "fs";
import log4js from "log4js";
import { Parser } from "json2csv"
import xlsx from "xlsx"
var logger = log4js.getLogger();


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

function writeArrayJson2Xlsx(filename, array) {
  let workbook = xlsx.utils.book_new();
  let worksheet = xlsx.utils.json_to_sheet(array);
  xlsx.utils.book_append_sheet(workbook, worksheet);
  xlsx.writeFile(workbook, filename);
}

// main
let stockdata = {};
let checkSymbol = {};
let formater = new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 });

(async () => {
  let cop = [];

  let requested = 0;
  let responsed = 0;
  let csv = new Parser({ fields: ['price', 'change', 'match_qtty', 'side', 'time', 'total_vol'] });
  cop = await getlistallstock();
  let watchlist = ['HPG', 'DCM', 'HSG', 'NKG', 'VIX', 'SHS'];

  let total_check = 0;
  for (let x of cop) {
    if (x.stock_code.length < 4) {
      total_check++;
    }
  }

  let xp = cop.filter((e)=>e.stock_code.length <4);
 
  let stat = { req: 0, res: 0, record: 0 }

  
  let ret = [];

  let p = new Promise(async(resolve)=>{
    for(let x of xp ){
      while(stat.req - stat.res >= 100){
        await wait(1)
      }
      stat.req++;
      let z =  getTransVolByGroup(x.stock_code)
      
      z.then(data=>{
        stat.res++;
        if(data.data.total_transaction > 0)
          data.data.detail.forEach(e => {
            e.code = x.stock_code;
            ret.push(e)
          });
  
        if(stat.res == xp.length){
          resolve(ret)
        }
        
      })
  
      if(stat.req %100 == 0){
        console.log(stat)
      }
    }
  })
  
  let x =await p;
  console.table(ret)
  writeArrayJson2Xlsx("./filter/" + "VNINDEX_VolGroup.xlsx", ret)

})();




function wait(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(0);
    }, ms);
  });
}

async function getTransVolByGroup(symbol) {
  let a = await fetch("https://api-finance-v2.24hmoney.vn/v1/ios/stock/transaction-vol-by-group?device_id=web1689045n2a2p5iurbndpn3ipbak5dblcxkkkep6795881&device_name=INVALID&device_model=Windows+10&network_carrier=INVALID&connection_type=INVALID&os=Chrome&os_version=115.0.0.0&access_token=INVALID&push_token=INVALID&locale=vi&browser_id=web1689045n2a2p5iurbndpn3ipbak5dblcxkkkep6795881&symbol=" + symbol, {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7",
    "sec-ch-ua": "\"Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"115\", \"Chromium\";v=\"115\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "Referer": "https://24hmoney.vn/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "body": null,
  "method": "GET"
}, { timeout: 1000 });
  let x = await a.json();
  x["Code"] = symbol;
  return x;

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
    "mode": "cors"
  }, { timeout: 1000 });
  let x = await a.json();
  x["Code"] = symbol;
  return x;

}

async function getlistallstock() {
  let cop = [];
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
}

