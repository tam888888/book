import puppeteer from "puppeteer";
import fetch from "node-fetch";
import fs from "fs";
import parser from "xml2json";
import log4js from "log4js";
import xlsx from "xlsx"
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
  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  // page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  var myArgs = process.argv.slice(2);
  console.log(myArgs);
  var dem = [];
  var names = [];
  // for (let f of myArgs) {
  // var data = fs.readFileSync(myArgs[0], { encoding: 'utf8', flag: 'r' });
  // var nn = data.split("\n");  
  // for (let n of nn) if (n.length > 0 ) dem.push(n.trim());
  // }

  // data = fs.readFileSync(myArgs[1], { encoding: 'utf8', flag: 'r' });
  // var nn = data.split("\n");
  // for (let n of nn)  if (n.length > 0 )  names.push(n.trim());

  //Trịnh Trúc Nhã Phương
  var urlp1 = "https://tenchocon.vn/name/Tr%E1%BB%8Bnh-";
  // var urlp2 = "-Nhã-An.html";
  var urlp2 = ".html";

  // for (let x of names) {
  //   for (let d1 of dem) {
  //     for (let d2 of dem) {
        // console.log("====================== Name " + x + " ======================");
        // x = x.replaceAll("\"", "");
        var p = 0;
        while (true) {
          // var url = urlp1 + d1 + "-" + d2 + "-" + x + urlp2;
          var url = "https://tenchocon.vn/name/Tr%E1%BB%8Bnh-Như-Trúc-Viên.html";
          console.log(url);
          try {
            const t = await fetch(url, { timeout: 5000 });
            var z = await t.text();
            var key = "lb_danhgia\">";
            var idx1 = z.indexOf(key) + key.length;
            var idx2 = z.indexOf("</span>", idx1);
            var pointStr = z.substring(idx1, idx2);
            var idx = pointStr.indexOf("/");
            for (var i = idx; i >= 0; i--) {
              if (pointStr.charAt(i) == ' ') {
                console.log(pointStr.substring(i + 1, idx) + " " + pointStr.substring(0, i));
                logger.info(pointStr.substring(i + 1, idx) + " " + pointStr.substring(0, i));
                break;
              }
            }
            // console.log(z.substring(idx1,idx2));
            break;
          } catch (e) {
            console.log(e);
          }
        }
  //     }
  //   }
  // }
  for (let f of myArgs) {
    console.log("====================== END " + f + " ======================");
    logger.log("====================== END " + f + " ======================");
  }

  let table = [{name:"Hung",tuoi:45}]

  // XLSX.utils.table_to_book(table);

  let Headers = ['ChangeId', 'ChangeDescription', 'ChangeDate', 'Enhancement/Fix', 'ExcutorTeam'];
let Data = ['INC1234', 'Multiple Cert cleanup', '04/07/2022', 'Enhancement', 'IlevelSupport'];

let workbook = xlsx.utils.book_new();
let worksheet = xlsx.utils.aoa_to_sheet([]);

xlsx.utils.book_append_sheet(workbook, worksheet);

xlsx.utils.sheet_add_aoa(worksheet, [Headers], { origin: 'A1' });
xlsx.utils.sheet_add_aoa(worksheet, [Data], { origin: 'A2' });


xlsx.writeFile(workbook, "Test.xlsx");
console.log("written")
})();