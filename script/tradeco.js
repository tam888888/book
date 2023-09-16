import { parse } from "node-html-parser"
import fs from "fs"

(async () => {
  let a = await fetch("https://tradingeconomics.com/commodities", {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7",
      "cache-control": "max-age=0",
      "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "cookie": "_ga=GA1.2.1636809219.1681099624; __gads=ID=416f7f85b75c5ce3-2258ec4611dd00bd:T=1681099625:RT=1681099625:S=ALNI_MYllQgEk2nZVC6SaP37hnQAfLGlHw; ASP.NET_SessionId=nlfuqtipdf5cieh51i1rxxli; _gid=GA1.2.578521872.1682299474; __gpi=UID=00000bf01f4ae3bc:T=1681099625:RT=1682299474:S=ALNI_MZJMhpMY_Etdn4xL0k847DqxDcKZQ; .ASPXAUTH=FE640A272109AF19EF63440811F5E7CEF216286B29DE1765B52CABBF38E7DB3CD271FA743A324361AD51AD4170ECA1BCCB642D1FBE9165C33640BC654A9825B2DB1BEB50B7C18E068A773C41B6BF23E95A3D269075C6F8195EA2B97D474F1BB8F7F80269; TEUsername=07lF1/MZ77HYedvhjR8Owa6HYjsdCzq+hRkl99ka0V4=; TEUserInfo=3fc648a1-8c9a-447c-a3e5-54690f3ff86e; TEName=Trinh Van Hung"
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  });


  let html = await a.text();
  let root = parse(html)
  let x = root.querySelectorAll("tr.datatable-row, tr.datatable-row-alternating")
  let x1 = [...x]
  let x2 = x1.map(e => {
    let symbol = e.getAttribute("data-symbol");
    console.log(symbol)
    let e1 = [...e.childNodes]
    let href = e1[1].querySelector("a[href]").getAttribute("href");
    // console.log("href",href+"")
    e1 = [...e1[1].childNodes, ...e1.slice(2, e1.length)]
    let at = [symbol, href, ...e1.map(e2 => e2.textContent.trim()).filter(e => e != '')]
    let k = ['symbol', 'href', 'name', 'unit', 'price', 'change', 'daily', 'weekly', 'monthly', 'yoy', 'date']
    let ret = {}
    k.forEach((e, i) => { ret[e] = at[i] })
    return ret
  })
  console.table(x2)


  // let span = ["max", "5y", "10y", "1y"]
  let span = ["1y"]

  span.forEach(async span => {
    // console.table(data1)
    if (!fs.existsSync("tradeecox" + span + ".json")) {
      let data = []
      let pro = []
      x2.forEach(async e => {
        // console.log(e.href)
        let d1 = fetchData(e.symbol, e.href, span);
        pro.push(d1)
        let d = await d1;
        data.push(d)
      })
      await Promise.all(pro);
      // let data1 = data.map(e=>e.series)
      console.table(data)
      fs.writeFileSync("tradeecox" + span + ".json", JSON.stringify(data))
    }
    else {
      let ct = fs.readFileSync("tradeecox" + span + ".json", "utf-8")
      let data = JSON.parse(ct)
      let data1 = data.map(e => e.series)
      console.table(data)
      console.table(data1[3])
      console.table(data1[3][0].data)
    }
  }
  )

})();


async function fetchData(symbol, url, span) {
  if (url.includes("steel")) {
    // console.log(url)
  }
  let a = await fetch("https://markets.tradingeconomics.com/chart?s=" + symbol + "&span=" + span + "&securify=new&url=/commodity/steel&AUTH=3gqPFsQtJsaSi9yuywUgQSJa6bHFjBbvUBt3xRBSRRhUe%2FQ5ZHCPLGBdcntp38h9&ohlc=0", {
    "headers": {
      "accept": "application/json, text/javascript, */*; q=0.01",
      "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7",
      "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site"
    },
    "referrer": "https://tradingeconomics.com/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  });

  let z = await a.text()
  // console.log(z)
  if (z.startsWith('{') && z.endsWith('}')) {
    return JSON.parse(z)
  } else
    return {};

}