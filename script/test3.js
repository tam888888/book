import { Exchange } from "./Exchange.js";
import fetch from "node-fetch";
import request from 'request'
import puppeteer from "puppeteer";
import http from "node:http";
import https from "node:https";
import { resolve } from "path";
import chalk from "chalk";
import Table2 from 'cli-table3'
import term from 'term.js'
// import superagent from 'superagent'
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
const agent = (_parsedURL) => _parsedURL.protocol == 'http:' ? httpAgent : httpsAgent;

import Table from "tty-table";

(async () => {
  
  console.log(new Date(Date.now() + 6*60*60*1000))

  let header = [{
    value: "item",
    headerColor: "cyan",
    color: "white",
    align: "left",
    width: 20
  },
  {
    value: "price",
    color: "red",
    width: 10,
    formatter: function (value) {
      console.log("val",value)
      return value;
      // let str = `$${value.toFixed(2)}`
      // return (value > 5) ? this.style(str, "green", "bold") : 
      //   this.style(str, "red", "underline")
    }
  }]


  const rows = [
    {
      item: "hamburger",
      price: 2.50
    }
    ,
    {
      item: "abc",
      price: 0
    }    
  ]
  
  const options = {
    borderStyle: "solid",
    borderColor: "blue",
    headerAlign: "center",
    align: "left",
    color: "white",
    truncate: "...",
    width: "90%"
  }


  const out = Table(header,rows,options).render()
console.log(out); //prints output

rows.map(e=>{

    Object.keys(e).forEach((v,i)=>{
      switch(v){
        case 'price':
          console.log(chalk.green(e[v]))
          e[v] = chalk.green.bold(e[v]);
        default:
          return;
      }
    })
})
console.log(Object.keys(rows[0]))
var table = new Table2({head: [...Object.keys(rows[0])]});
table.push( Object.values(   {
  item: chalk.blue.bold.bgBlack("hamburger"),
  price: chalk.green.bgRed(0),
}))

table.push( Object.values({
  price: chalk.green(2.50),
  item: chalk.blue.bgRed("zzzz"),
})   )


console.table(table.toString())
console.table(rows)
})()



