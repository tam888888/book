import puppeteer from "puppeteer";
import fetch from "node-fetch";
import fs from "fs";
import parser from "xml2json";
import log4js from "log4js";
//sudo apt-get install -y libatk-bridge2.0-0 libgtk-3.0 libasound2 libgbm-dev
var logger = log4js.getLogger();

log4js.configure({
  appenders: {
    everything: { type: "file", filename: "diem.log" },
  },
  categories: {
    default: { appenders: ["everything"], level: "debug" },
  },
});

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  var myArgs = process.argv.slice(2);  
  console.log(myArgs);
  var names = [];
  for (let f of myArgs) {
    const data = fs.readFileSync(f, { encoding: 'utf8', flag: 'r' });    
    var nn = data.split("\n");
    for (let n of nn) names.push(n);
  }

  var urlp1 = "https://tenchocon.vn/name/Tr%E1%BB%8Bnh-Tr%C3%BAc-Nh%C3%A3-";
  var urlp2 = ".html";

  for (let x of names) {
    console.log("====================== Name " + x + " ======================");
    x = x.replaceAll("\"","");
    var p = 0;
    while (true) {
      var url = urlp1 + x + urlp2;
      console.log(url);
      // await page.setDefaultNavigationTimeout(0);
      try {
        await page.goto(url);
        // await page.screenshot({ path: 'images/name_'+x+'.png' });
        const ar = await page.evaluate(async () => {
          var pointStr = document.querySelectorAll("#lb_danhgia")[0].innerText;
          var floatPoint = parseFloat(pointStr);
          // console.log(pointStr);
          ax = [];
          ax.push(pointStr);
          return new Promise(resolve => {
            resolve(ax);
          });
        });

        const vv = await ar;

        for (let v of vv) {
          console.log(v);
          logger.info(v);
        }
        p++;
        if (vv.length != 0) {
          break;
        }

      } catch (e) {
        console.log(e);
      }


    }

    // console.log("================================================ END " + x + " ================================================");
    // logger.info("================================================ END " + x + " ================================================");
  }

  browser.close();

})();