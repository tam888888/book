
import { Exchange } from "./Exchange.js";
import fetch from "node-fetch";
import fs from "fs";


(async () => {
  

    let data = fs.readFileSync('symbol.json');
    let stockData = JSON.parse(data);

    // console.log(stockData)
    let list = [];
    for(let key of Object.keys(stockData)){
        list.push([key,...stockData[key]]);
    }


    list.sort((a,b)=>{
        let x1 = (a[1] + a[5]) / (a[2]+a[6] == 0? 1: a[2]+a[6]);
        let x2 = (b[1] + b[5]) / (b[2]+b[6] == 0? 1: b[2]+b[6]);

        let x3 = a[1] > b[1] ? 1: a[1] < b[1] ?-1: (a[2] > b[2] ? 1: a[2] < b[2] ? -1 : 0)
        let x4 = a[1]+a[5] - a[2] - a[6]
        // return (x2 > x1?1: x2 < x1 ?-1: x3)
        
        return x3;
    });

    // console.log(list)

    for(let e of list){
        // console.log(e)
        console.log(e[0],e[1],e[2],e[3],e[4],e[5],e[6],e[7],e[8])
    }

})();