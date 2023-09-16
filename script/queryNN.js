 
import { Exchange } from "./Exchange.js";
import fetch from "node-fetch";
import fs from "fs";
import { colours } from "./Utils.js";
import xlsx from "xlsx"

(async () => {


    let data = fs.readFileSync('NDTNN.json');
    let stockData = JSON.parse(data);

    // console.log(stockData)
    //"AAA":{"b":127800,"bv":911780000,"s":178700,"sv":1262300000,"p":7.19}
    let list = [];
    for (let key of Object.keys(stockData)) {
        // list.push([key, ...stockData[key]]);
        let e = stockData[key];
        list.push({
            symbol:key,
            b:e.b,
            bv:e.bv,
            s:e.s,
            sv:e.sv,
            p:e.p,
        });
    }
    let ration = (e) => {
        if (e.bv - e.sv == 0) { return 0; }
        if (Number.isNaN(e.bv) || Number.isNaN(e.sv) || Number.isNaN(e.s || Number.isNaN(e.b))) {
            return 0;
        }
        let val = (((e.b - e.s) * e.p * 1000 - (e.bv - e.sv)) / (e.bv - e.sv) * 100);
        return val;
    };

    let lailo = (e) => {        
        if (Number.isNaN(e.bv) || Number.isNaN(e.sv) || Number.isNaN(e.s || Number.isNaN(e.b))) {
            console.log("==========================================")
            return 0;
        }
        if (e.bv - e.sv == 0) { return 0; }
 
        let val = (((e.b - e.s) * e.p * 1000 - (e.bv - e.sv)));
        return val;
    };
    list = list.map(e => {
        e['lailo'] = lailo(e);
        e['ration'] = ration(e);
        return e;
    })

    // list.sort((a, b) => {
    //     let x1 = a.b - a.s      
    //     let x2 = b.b - b.s
    //     let x3 = a.b > b.b ? 1: a.b < b.b?-1: (a.s > b.s ? 1: a.s < b.s?-1:0)
    //     return (x1 > x2?-1: x1 < x2 ?1: x3)
    //     // let x1 = a[7] > b[7] ? -1 : a[7] < b[7] ? 1 : 0

    //     // console.log(a[7], b[7])
    //     // return x1;
    // });


    list.sort((a, b) => {
        let x1 = a.bv - a.sv      
        let x2 = b.bv - b.sv
        let x3 = a.bv > b.bv ? 1: a.bv < b.bv?-1: (a.sv > b.sv ? 1: a.sv < b.sv?-1:0)
        return (x1 > x2?-1: x1 < x2 ?1: x3)
        // let x1 = a[7] > b[7] ? -1 : a[7] < b[7] ? 1 : 0

        // console.log(a[7], b[7])
        // return x1;
    });


    // console.log(list)

    // console.log("Ma".padEnd(3), "Gia".padEnd(5),
    //     "Mua-Ban(KL)".padEnd(20),
    //     "Mua-Ban(Val)".padEnd(20),
    //     "Mua-Ban(Goc)".padEnd(20),
    //     "LaiLo".padEnd(20),
    //     "LaiLo(%)".padEnd(8),
    //     "Mua".padEnd(10), "Ban".padEnd(10), "Mua(Val)".padEnd(20), "Ban(Val)".padEnd(20))

    let i =0;
    // for (let e of list) {
    //     // console.log(e)
    //     if (e.p == undefined || e.b == undefined) {
    //         console.log(e)
    //         continue;
    //     }
    //     console.log(i++%2 == 0? colours.fg.green:colours.fg.magenta,e.symbol, e.p.toFixed(2).padEnd(5),
    //         (e.b - e.s).toString().padEnd(20),
    //         ((e.b - e.s) * e.p * 1000).toFixed(2).padEnd(20),
    //         (e.bv - e.sv).toFixed(2).padEnd(20),
    //         ((e.b - e.s) * e.p * 1000 - (e.bv - e.sv)).toFixed(2).padEnd(20),
    //         (((e.b - e.s) * e.p * 1000 - (e.bv - e.sv)) / (e.bv - e.sv) * 100).toFixed(2).padEnd(8),
    //         e.b.toString().padEnd(10), e.s.toString().padEnd(10), e.bv.toString().padEnd(20), e.sv.toString().padEnd(20))
    // }

    list = list.map(e=>{ 
        e['b-s'] = e.b - e.s
        e['b-s(valbyp)'] = (e.b - e.s)*1000*e.p;
        e['b-s(val)'] = (e.bv - e.sv);
        let pavg = Math.floor((e.bv - e.sv)/(e.b - e.s)/1000 *100)/100;
        e['pavg'] = pavg;
        e['p(-)'] = Math.floor((pavg-e['p'])*100)/100;
        e['lailo'] =(((e.b - e.s) * e.p * 1000 - (e.bv - e.sv)) / (e.bv - e.sv) * 100).toFixed(2);
        
        return e;
    })

    console.table(list);

    writeArrayJson2Xlsx( "./filter/NN.xlsx", list)

})();


function writeArrayJson2Xlsx(filename, array) {
    let workbook = xlsx.utils.book_new();
    let worksheet = xlsx.utils.json_to_sheet(array);
    xlsx.utils.book_append_sheet(workbook, worksheet);
    xlsx.writeFile(workbook, filename);
  }