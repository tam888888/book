import fs from "fs"
import { Exchange } from './Exchange.js';

(async () => {
    // let listSymbol = await Exchange.getlistallsymbol()
    // listSymbol = listSymbol.filter(e => e.length == 3);
    // let stockdata = {}
    // let z = await Exchange.getliststockdata(listSymbol, stockdata);

    // console.table(stockdata['SHS'])
    // console.table(stockdata['NVL'])
    // console.table(stockdata['VGI'])
    // await Exchange.SSI.getlistallsymbol()
    
    // // console.log(Date.now())
    // console.log("Data")
    // // let data = await Exchange.SSI.graphql("NVL")
    // let data = await Exchange.SSI.graphql("NVL")
    // console.log("End")
    // console.table(data.data.slice(0,10))
    // data = await Exchange.CafeF.DataHistory("NVL")
    // console.table(data.data.slice(0,10))

   let jsdata= fs.readFileSync("googlemaps/spa.json","utf-8")
   let adata = JSON.parse(jsdata);
   console.table(adata)
   console.table(adata.length)

})();


