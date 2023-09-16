import puppeteer from "puppeteer";
import fetch from "node-fetch";
import fs from "fs";
import parser from "xml2json";
import log4js from "log4js";
//sudo apt-get install -y libatk-bridge2.0-0 libgtk-3.0 libasound2 libgbm-dev
var logger = log4js.getLogger();

// log4js.configure({
//   appenders: {
//     everything: { type: "file", filename: "all-the-logs.log" },
//   },
//   categories: {
//     default: { appenders: ["everything"], level: "debug" },
//   },
// });

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  var myArgs = process.argv.slice(2);
  var stories=myArgs[0];
  // if(stories)
  // await page.goto('https://www.littlefox.com/en/readers/contents_list/DP000602');
  console.log(stories);

  // var abc = ['A','Ă','Â','B','C','D','Đ','E','Ê','G','H','I','K','L','M','N','O','Ô','Ơ','P','Q','R','S','T','U','Ư','V','X','Y']
  var abc = stories.split(",");
  var pages = [...Array(1000).keys()];

  //https://tenchocon.vn/?ho=&name=A&sex=0&page=0
  var urlp1 = "https://tenchocon.vn/?ho=&name=";
  var urlp2 = "&sex=0&page=";
  var stories = "https://tenchocon.vn/";

  for(let x of abc){
    log4js.configure({
      appenders: {
        everything: { type: "file", filename: x+".log" },
      },
      categories: {
        default: { appenders: ["everything"], level: "debug" },
      },
    });    
    console.log("====================== Name " + x +" ======================");
    var p = 0;
    while(true){
      var url = urlp1 + x + urlp2 + p;
      console.log(url);
      // await page.setDefaultNavigationTimeout(0);
      try{
      await page.goto(url);
      await page.screenshot({ path: 'images/name_'+x+'_'+p + '.png' });
      const ar = await page.evaluate(async () => {
        // a = document.querySelectorAll("a.btn.btn-sm.btn-abc");
        var sex = document.querySelectorAll("#ContentPlaceHolderTenChCon_DataList1")[0].querySelectorAll("a.Sex")
        var sexf = document.querySelectorAll("#ContentPlaceHolderTenChCon_DataList1")[0].querySelectorAll("a.SexFalse")
        var sext = document.querySelectorAll("#ContentPlaceHolderTenChCon_DataList1")[0].querySelectorAll("a.SexTrue")
        ax = [];
        ii = 0;
        for (let i of sex) {
          // console.log(i.innerText);
          ax.push("SEXN "+i.innerText);
        }    
        for (let i of sexf) {
          // console.log(i.innerText);
          ax.push("SEXF "+i.innerText);
        }
        for (let i of sext) {
          // console.log(i.innerText);
          ax.push("SEXT "+i.innerText);
        }        
        return new Promise(resolve => {
          resolve(ax);
        });
      });

      const vv = await ar;

      for(let v of vv){
        console.log(v);
        logger.info(v);
      }
      p++;
      if(vv.length == 0){
        break;
      }
            
      }catch(e){
        console.log(e);
      }


    }

    console.log("================================================ END " + x + " ================================================"); 
    logger.info("================================================ END " + x + " ================================================");
  }
 
  browser.close();
  
})();