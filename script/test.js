import fetch from "node-fetch";
(async () => {
  console.log("ok")
  var x = [];
  for (var i = 1; i < 1000; i++) {
    x.push(1000 * Math.random());
  }


  x.forEach((element, index) => {
    // console.log(element, index)
  });

  const getHi = val => { console.log(val); var t = Math.max(...x.slice(0)); console.log(t); return t; };

  console.log(getHi(x))
  // console.log(x.slice(1.3))


  let fd = new Date();
  const fs = fd.getFullYear() + "-" + (fd.getMonth() + 1) + "-" + fd.getDate()
  console.log(fs);


  // var a = await fetch("https://api-finfo.vndirect.com.vn/v4/stock_intraday_latest?q=code:HPG&sort=time&size=100000", {
  //     "headers": {
  //         "accept": "application/json, text/plain, */*",
  //         "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
  //         "sec-ch-ua-mobile": "?0"
  //     },
  //     "referrer": "https://trade.vndirect.com.vn/",
  //     "referrerPolicy": "strict-origin-when-cross-origin",
  //     "body": null,
  //     "method": "GET",
  //     "mode": "cors"
  // });

  // var x = await a.text()

  // console.log(x);


  let cop = [];
  let exs = ['hose', 'hnx', 'upcom']
  for (let ex of exs) {
    let a = await fetch("https://wgateway-iboard.ssi.com.vn/graphql", {
      "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7",
        "content-type": "application/json",
        "g-captcha": "",
        "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site"
      },
      "referrer": "https://iboard.ssi.com.vn/",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": "{\"operationName\":\"stockRealtimes\",\"variables\":{\"exchange\":\"" + ex + "\"},\"query\":\"query stockRealtimes($exchange: String) {\\n  stockRealtimes(exchange: $exchange) {\\n    stockNo\\n    ceiling\\n    floor\\n    refPrice\\n    stockSymbol\\n    stockType\\n    exchange\\n    matchedPrice\\n    matchedVolume\\n    priceChange\\n    priceChangePercent\\n    highest\\n    avgPrice\\n    lowest\\n    nmTotalTradedQty\\n    best1Bid\\n    best1BidVol\\n    best2Bid\\n    best2BidVol\\n    best3Bid\\n    best3BidVol\\n    best4Bid\\n    best4BidVol\\n    best5Bid\\n    best5BidVol\\n    best6Bid\\n    best6BidVol\\n    best7Bid\\n    best7BidVol\\n    best8Bid\\n    best8BidVol\\n    best9Bid\\n    best9BidVol\\n    best10Bid\\n    best10BidVol\\n    best1Offer\\n    best1OfferVol\\n    best2Offer\\n    best2OfferVol\\n    best3Offer\\n    best3OfferVol\\n    best4Offer\\n    best4OfferVol\\n    best5Offer\\n    best5OfferVol\\n    best6Offer\\n    best6OfferVol\\n    best7Offer\\n    best7OfferVol\\n    best8Offer\\n    best8OfferVol\\n    best9Offer\\n    best9OfferVol\\n    best10Offer\\n    best10OfferVol\\n    buyForeignQtty\\n    buyForeignValue\\n    sellForeignQtty\\n    sellForeignValue\\n    caStatus\\n    tradingStatus\\n    remainForeignQtty\\n    currentBidQty\\n    currentOfferQty\\n    session\\n    __typename\\n  }\\n}\\n\"}",
      "method": "POST",
      "mode": "cors"
    });
    let x = await a.json()
    // console.log(x);
    cop = [...cop, ...x.data.stockRealtimes];
  }

  let cop2 = [];
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
  // console.log(xx.length)
  cop2 = [...cop2, ...xx];
  // return cop;

  console.log(cop2[0]);
  console.log(cop[0]);

  let ck = new Set();
  let ck2 = new Set();
  for (let e of cop2) {
    if (e.stock_code.length <= 3)
      ck2.add(e.stock_code);
  }

  for (let e of cop) {
    if (e.stockSymbol.length <= 3)
      ck.add(e.stockSymbol);
  }
  console.log(ck2.size)
  console.log(ck.size)
  console.log("check 1")
  for (var e of cop) {
    if (e.stockSymbol.length <= 3)
      if (!ck2.has(e.stockSymbol)) {
        console.log("ssi", e.exchange, e.stockSymbol)
      }
  }

  console.log("check 2")
  for (var e of cop2) {
    if (e.stock_code.length <= 3)
      if (!ck.has(e.stock_code)) {
        // console.log("vps",e.post_to,e.stock_code)
      }
  }



  // for(let e of cop){
  //   console.log(e.stockSymbol.length> 3? "xxxxxxx":"");
  // }

  let fundamental = [];
  let ok = 0;
  // console.log(cop2)
  let req = 0;
  for (let e of cop2) {
    if (e.stock_code.length >= 4) {
      continue;
    }
    // setTimeout( () => {

    let a = fund(e.stock_code);
    req++;

    // let x = await a.json();
    //   fundamental.push(x);
    //   // console.log(x);
    //   console.log(ok++, " ", e.stock_code);

    a.then(async (res) => res.json()).then(async x => {
      {
        x["symbol"] = e.stock_code;
        let nok = false;
        while (x["beta"] == null || x["beta"] == undefined) {
          console.log(ok, " ERROR ", e.stock_code);

          let a2 = await fund(e.stock_code);

          x = await a2.json();
          nok = true;
          // return;
        }

        if (nok) {
          console.log(ok, " ERROR2 ", e.stock_code);
        }
        ok++;
        // console.log(ok++, " ", e.stock_code);
        fundamental.push(x);
        // console.log(x);

        if (req == ok) {
          fundamental = fundamental.sort((a, b) => {
            if (a.beta > b.beta) return -1;
            if (a.beta < b.beta) return 1;
            return 0;

          })

          for (let i = 0; i < 100; i++)
            console.log(fundamental[i].symbol, fundamental[i].beta)
          for (let e of fundamental) {
            if (e.symbol == "CEO") {
              console.log(e)
            }
          }
        }
      }

    })
    // }, 500);





  }
  // fundamental.sort((a, b) => {
  //   if (a.beta > b.beta) return 1;
  //   if (a.beta < b.beta) return -1;
  //   return 0;

  // })

  // for (let i = 0; i < 10; i++)
  //   console.log(fundamental[i])


})();


function fund(stock_code) {

  let a = fetch("https://restv2.fireant.vn/symbols/" + stock_code + "/fundamental", {
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
    "mode": "cors"
  });

  return a;
}