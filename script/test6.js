import { Exchange } from "./Exchange.js";
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
(async ()=>{
  Exchange.getlistallstock();

  let x = [0,1,2,3,4,5,6]

  console.log(Math.max(...x))
  console.log(Math.min(...x))

  let x2 = [...x];

  console.log(x.reverse())
  console.log(x)
  console.log(x2)


  let d = new Date(2022,11,9);

  console.log(d)
  console.log(d.getTime())

  console.log(x.includes(15))

  let listSymbol = await Exchange.getlistallsymbol();
  listSymbol = listSymbol.filter((s) => {
    return s.length <= 3;
  })

  // let allSymbols = await Exchange.vndGetAllSymbols();

  // let symbolExchange = {};

  // allSymbols.forEach(v => {
  //   symbolExchange[v.code] = v.floor;
  // });

  // console.log(listSymbol)
  // listSymbol = allSymbols.map(e => e.code).filter(e=> e.length == 3);
  let stockdata = {}
  let z = Exchange.getliststockdata(listSymbol, stockdata);

  // z.then(res => console.log(res))
  await z;

  x = ["0,1,2,3,4,5,6" , "2", "ABCD", "Z"]
  // console.log(x.filter())
  console.table(stockdata["HPG"])

  console.log(+(5*1.0/1.0).toFixed(2) )

  Exchange.tpcp();
})();