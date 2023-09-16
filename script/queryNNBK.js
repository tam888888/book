
import { Exchange } from "./Exchange.js";
import fetch from "node-fetch";
import fs from "fs";


(async () => {


    let data = fs.readFileSync('NDTNN.json');
    let stockData = JSON.parse(data);

    // console.log(stockData)
    //"AAA":{"b":127800,"bv":911780000,"s":178700,"sv":1262300000,"p":7.19}
    let list = [];
    for (let key of Object.keys(stockData)) {
        // list.push([key, ...stockData[key]]);
        list.push({key:stockData[key]});
    }
    let ration = (e) => {
        if (e[2] - e[4] == 0) { return 0; }
        if (Number.isNaN(e[2]) || Number.isNaN(e[4]) || Number.isNaN(e[3] || Number.isNaN(e[1]))) {
            return 0;
        }
        let val = (((e[1] - e[3]) * e[5] * 1000 - (e[2] - e[4])) / (e[2] - e[4]) * 100);
        return val;
    };

    let lailo = (e) => {        
        if (Number.isNaN(e[2]) || Number.isNaN(e[4]) || Number.isNaN(e[3] || Number.isNaN(e[1]))) {
            console.log("==========================================")
            return 0;
        }
        if (e[2] - e[4] == 0) { return 0; }
 
        let val = (((e[1] - e[3]) * e[5] * 1000 - (e[2] - e[4])));
        return val;
    };
    list = list.map(e => [...e, ration(e), lailo(e)])

    list.sort((a, b) => {
        let x1 = a[1] - a[3]      
        let x2 = b[1] - b[3]
        let x3 = a[1] > b[1] ? 1: a[1] < b[1]?-1: (a[3] > b[3] ? 1: a[3] < b[3]?-1:0)
        return (x1 > x2?-1: x1 < x2 ?1: x3)
        // let x1 = a[7] > b[7] ? -1 : a[7] < b[7] ? 1 : 0

        // console.log(a[7], b[7])
        return x1;
    });

    // console.log(list)

    console.log("Ma".padEnd(3), "Gia".padEnd(5),
        "Mua-Ban(KL)".padEnd(20),
        "Mua-Ban(Val)".padEnd(20),
        "Mua-Ban(Goc)".padEnd(20),
        "LaiLo".padEnd(20),
        "LaiLo(%)".padEnd(8),
        "Mua".padEnd(10), "Ban".padEnd(10), "Mua(Val)".padEnd(20), "Ban(Val)".padEnd(20))


    for (let e of list) {
        // console.log(e)
        if (e[5] == undefined || e[1] == undefined) {
            console.log(e)
            continue;
        }
        console.log(e[0], e[5].toFixed(2).padEnd(5),
            (e[1] - e[3]).toString().padEnd(20),
            ((e[1] - e[3]) * e[5] * 1000).toFixed(2).padEnd(20),
            (e[2] - e[4]).toFixed(2).padEnd(20),
            ((e[1] - e[3]) * e[5] * 1000 - (e[2] - e[4])).toFixed(2).padEnd(20),
            (((e[1] - e[3]) * e[5] * 1000 - (e[2] - e[4])) / (e[2] - e[4]) * 100).toFixed(2).padEnd(8),
            e[1].toString().padEnd(10), e[3].toString().padEnd(10), e[2].toString().padEnd(20), e[4].toString().padEnd(20))
    }

})();