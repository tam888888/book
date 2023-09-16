
import { Exchange } from "./Exchange.js";
import fetch from "node-fetch";
import fs from "fs";
import { colours } from "./Utils.js";


(async () => {


    let data = fs.readFileSync('symbol.json');
    let stockData = JSON.parse(data);

    // console.log(stockData)
    let list = stockData;
    // for(let key of Object.keys(stockData)){
    //     list.push([key,...stockData[key]]);
    // }

    // {symbol:k,
    //     mkl: d[0], mua khop lenh
    //     bkl: d[1], ban khop lenh
    //     mvkl: d[2], mua volume khop lenh
    //     bvkl: d[3], 
    //     mtt: d[4],
    //     btt: d[5],
    //     mvtt:d[6], 
    //     bvtt:d[7], 
    //    }    


    list = list.map(e=>{
        e["mb"] = e.mkl + e.mtt - e.bkl - e.btt;
        e["mbv"] = e.mvkl + e.mvtt - e.bvkl - e.bvtt;
        e["price"] = (e.mbv/e.mb).toFixed(2);
        return e;
    });
    // console.log(list)
    list = list.sort((a, b) => {

        let x3 = a.mkl > b.mkl ? 1 : a.mkl < b.mkl ? -1 : (a.bkl > b.bkl ? 1 : a.bkl < b.bkl ? -1 : 0)
        let t = a.mb - b.mb
        let x1 = t> 0 ? -1: t < 0? 1: 0;
        t = a.mbv - b.mbv
        let x2 = t> 0 ? -1: t < 0? 1: 0;
        return x2;
    });

    // console.log(list)

    let format = (k, v) => {
        // console.log(k,v)
        if (k == 'symbol') {
            if (v == 'undefined') {
                return 'total'
            }
        }

        switch (k) {
            case 'mkl':
            case 'bkl':
            case 'mvkl':
            case 'bvkl':
            case 'mkl':
                case 'mb':
                    case 'mbv':                                    
                return v.toString().padEnd(10)
            case 'symbol':
                return v.toString().padEnd(5)
        }

        return v;
    }
    let i = 0;
    for (let e of list) {
        // console.log(e)
        i++;
        // console.log(i % 2 == 0 ? colours.fg.magenta : colours.fg.green, JSON.stringify(e, format).replaceAll('"', ''))
    }
    console.table(list)
})();