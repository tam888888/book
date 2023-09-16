
import { Exchange } from "./Exchange.js";
import fetch from "node-fetch";
import fs from "fs";


(async () => {
    console.log("ABC")
    let z = await Exchange.ratios("HPG");
    let x = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    console.log(await z.text())
    console.log(x.slice(-3))
    console.log(x)

    let zzzz = "123456789";

    console.log(zzzz.substring(-3, 3));

    let ex = (path) => {
        return path.includes("HOSE") ? "HOSE" : path.includes("HNX") ? "HNX" : "UPCOM";
    }

    console.log(ex("ABCUPCOMXXXX"));

    let z2 = await Exchange.stocks();

    // console.log(await z2.json())

    let data = fs.readFileSync('stock.json');
    let stockData = JSON.parse(data);

    let a = [];
    let b = [];
    for (let e of Object.keys(stockData)) {
        // console.log(stockData[e]);
        // var t = {};
        // t[e] = stockData[e].fundamental;
        stockData[e].fundamental["symbol"] = e;
        stockData[e].financialIndicators["symbol"] = e;
        if(stockData[e].financialIndicators != undefined){
            a.push(stockData[e].financialIndicators);
        }else{
            console.log("a.push(stockData[e].financialIndicators);",e)
        }
        
        b.push([stockData[e].fundamental,stockData[e].financialIndicators])
    }

    console.log(a.length)
    a = a.sort((x, y) => {        
        let t = x[2]["value"] - (y[2]["value"]);
        return t > 0? 1 : t < 0 ? -1 : 0
    });

    

    for (var i = 0; i < a.length; i++) {
        if(stockData[a[i]["symbol"]].fundamental.avgVolume10d > 500000 && stockData[a[i]["symbol"]].fundamental.marketCap > 100000000000)
            console.log(a[i]["symbol"],a[i][2]["value"]);
    }


    // console.log(stockData["MSN"])

    // let rp = Exchange.finacialReport("HPG");

    // rp.then(res=>{
    //         return res.json()
    //         // console.log(res);
    //     // console.log(res.data.headers,"\n",res.data.rows);
    // }).then((data)=>{        
    //     console.log(data[1][3].data.headers,"\n",data[1][3].data.rows);
    // }
    // )

    let value = "test";
    let f = ()=>{return a};
    let func = new Function('f',`return f()`)(f);
  
    // let zzzzz = func(f);

    console.log(func)
})();