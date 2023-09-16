import fetch from "node-fetch";
import fs from "fs";
import log4js from "log4js";
import { Parser } from "json2csv"
import path from "path";
import http from "node:http";
import https from "node:https";
import { Exchange } from "./Exchange.js";
import { Console } from 'node:console'
import { Transform } from 'node:stream'


var logger = log4js.getLogger();

log4js.configure({
    appenders: {
        everything: { type: "file", filename: "diem.log" },
        console: { type: "console" },
    },
    categories: {
        default: { appenders: [ "everything"], level: "debug" },
        app: { appenders: ["console"], level: "info" }
    },
});


const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
const agent = (_parsedURL) => _parsedURL.protocol == 'http:' ? httpAgent : httpsAgent;

const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk) } })
const log = new Console({ stdout: ts })

function getTable(data) {
    log.table(data)
    return (ts.read() || '').toString()
}

(async () => {

    let out = await Exchange.SSI.vn30();
    let data = out.data.stockRealtimesByGroup.map(e => {
        let ne = {};
        Object.keys(e).forEach(k => {
            if (e[k] != null) ne[k] = e[k];
        })

        return ne;
    });
    let bids = [];
    let asks = [];
    for (let i = 1; i <= 3; i++) {
        bids.push("best" + i + "BidVol");
        asks.push("best" + i + "OfferVol");
    }

    // let bid = data.reduce((a, b) => { return { best1BidVol: a.best1BidVol + b.best1BidVol, best2BidVol: (a.best2BidVol + b.best2BidVol), best3BidVol: (a.best3BidVol + b.best3BidVol) } }, { best1BidVol: 0, best2BidVol: 0, best3BidVol: 0 })
    let checkNull = (a) => {
        return a == '' || a == undefined ? 0 : a;
    }
    let bid = data.reduce((a, b) => {
        let ne = {};
        bids.forEach(k => {
            ne[k] = checkNull(a[k]) + checkNull(b[k]);
        })
        return ne;
    }, {
        ...((() => {
            let ne = {};
            bids.forEach(k => {
                ne[k] = 0;
            })
            return ne;
        })())
    })

    let ask = data.reduce((a, b) => {
        let ne = {};
        asks.forEach(k => {
            ne[k] = checkNull(a[k]) + checkNull(b[k]);
        })
        return ne;
    }, {
        ...((() => {
            let ne = {};
            asks.forEach(k => {
                ne[k] = 0;
            })
            return ne;
        })())
    })

    // let ask = data.reduce((a, b) => { return { best1OfferVol: a.best1OfferVol + b.best1OfferVol, best2OfferVol: (a.best2OfferVol + b.best2OfferVol), best3OfferVol: (a.best3OfferVol + b.best3OfferVol) } }, { best1OfferVol: 0, best2OfferVol: 0, best3OfferVol: 0 })



    logger.info(getTable(data.sort((a, b) => {
        let c = a.best1OfferVol - b.best1OfferVol;
        return c < 0 ? 1 : c > 0 ? -1 : 0

    })));

    let rd = (a, b) => { return a + b };
    console.log(bid, Object.values(bid).reduce(rd, 0));
    console.log(ask, Object.values(ask).reduce(rd, 0));


    bids = [];
    asks = [];
    for (let i = 1; i <= 10; i++) {
        bids.push("best" + i + "BidVol");
        asks.push("best" + i + "OfferVol");
    }

    let exchange = ["vn30", "hose", "hnx", "upcom"]

    let all = [];
    for (let ex of exchange) {
        data = await Exchange.SSI.stockRealtimes(ex);
        data = data.data.stockRealtimes.map(e => {
            let ne = {};
            Object.keys(e).forEach(k => {
                if (e[k] != null) ne[k] = e[k];
            })

            return ne;
        });

        bid = data.reduce((a, b) => {
            let ne = {};
            bids.forEach(k => {
                ne[k] = checkNull(a[k]) + checkNull(b[k]);
            })
            return ne;
        }, {
            ...((() => {
                let ne = {};
                bids.forEach(k => {
                    ne[k] = 0;
                })
                return ne;
            })())
        })

        ask = data.reduce((a, b) => {
            let ne = {};
            asks.forEach(k => {
                ne[k] = checkNull(a[k]) + checkNull(b[k]);
            })
            return ne;
        }, {
            ...((() => {
                let ne = {};
                asks.forEach(k => {
                    ne[k] = 0;
                })
                return ne;
            })())
        })
        console.table(bid);
        console.table(ask);
        // console.log(ask, Object.values(ask).reduce(rd, 0));
        let totalbid = Object.values(bid).reduce(rd, 0);
        let totalask = Object.values(ask).reduce(rd, 0);
        console.log(ex,"bid ",totalbid , " ask ", totalask, " delta(bid-ask) " , totalbid - totalask)
        all.push(...data);
    }


    logger.info(getTable(all.sort((a, b) => {
        let c = (checkNull(a.best1OfferVol) - checkNull(a.best1BidVol))  - (checkNull(b.best1OfferVol) - checkNull(b.best1BidVol));
        return c < 0 ? 1 : c > 0 ? -1 : 0

    })));
    //nmTotalTradedQty
    all = all.filter(e=>{return e.stockSymbol.length == 3;})
    logger.info(getTable(all.slice(0,15)));
    logger.info(getTable(all.slice(all.length-15,all.length)));

})();