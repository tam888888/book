import { Exchange } from "./Exchange.js";
import fetch from "node-fetch";
import request from 'request'
import puppeteer from "puppeteer";
import http from "node:http";
import https from "node:https";
import { Console } from 'node:console'
import { Transform } from 'node:stream'
import fs from "fs";
import XLSX from "xlsx"

(async () => {




  let Headers = ['ChangeId', 'ChangeDescription', 'ChangeDate', 'Enhancement/Fix', 'ExcutorTeam'];
  let Data = ['INC1234', 'Multiple Cert cleanup', '04/07/2022', 'Enhancement', 'IlevelSupport'];

  let workbook = XLSX.utils.book_new();


  // XLSX.utils.sheet_add_aoa(worksheet, [Headers], { origin: 'A1' });
  // XLSX.utils.sheet_add_aoa(worksheet, [Data], { origin: 'A2' });


  let a = await Exchange.vndGetAllSymbols();
  console.log(a)


  let worksheet = XLSX.utils.json_to_sheet(a);

  XLSX.utils.book_append_sheet(workbook, worksheet);
  XLSX.writeFile(workbook, "Test.XLSX");
  console.log("written")


  let kq=await fetch("https://finance.vietstock.vn/data/allkqkdorder", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      "cookie": "_cc_id=bd4b49a4b7a58cfaeb38724516b82171; dable_uid=35370669.1668475569175; dable_uid=35370669.1668475569175; __gads=ID=af0897d5e697b47b-2219cdf973d800fc:T=1668475507:S=ALNI_MaL0TTHW6nK5yq36h7SKojzDZdS3w; language=vi-VN; Theme=Light; isShowLogin=true; ASP.NET_SessionId=qzmb5wr2wd0sopqbgkmen5k1; __RequestVerificationToken=FcdJ2mHUqoXKgPnjcsW5RMkgHzYwGAN1tqm9F3oX4KwcZwT1JSg1BaOPKdzi8cNhluuOKvd-bKPR5EkZclt-BSiApZ3DYQWiNZ4wS6bPc1g1; AnonymousNotification=; _gid=GA1.2.1513324323.1676275818; _gat_UA-1460625-2=1; __gpi=UID=00000b7c20f7c81e:T=1668475507:RT=1676275827:S=ALNI_MbZNgtWTtbRI1MrLcfM5qFq0RIBMQ; panoramaId_expiry=1676362228300; panoramaId=4d0c5a1ada413b921c9b37c6d8d4a9fb927a0d4a71477931e7d9d438d60721a2; cto_bundle=MZdXjF9GalVXbDclMkJNeHNwS0pTN0VtbThsUDhJUmZPcHZIWFhkOGljTGl1dEV5Wm0lMkZ1eXZFaENDWGtzWnRKUDdUWTVzb2d1JTJGQTVnNjB4enZtaTB0dHpxQTZKc2taMDJOTEg2eSUyQmc4UVFSRDlwJTJCQU1DMDJuRUIwJTJGRVBGaSUyRjgxOGxEcXhSeHN1enUxNjFwYTNtR0M3blkySFpFQSUzRCUzRA; vts_usr_lg=312E3E6B21B988136F5F94F676DA2BF0BAC0FB3C7A9177453BBAE2736CC98DFC6700E661F85D549337E3B305F1411E26400C934C13702CDDE599D35A2CD2CFA91707BD3F641F84DF47259462B00A15D2395CE003E296705C4DF38FB1A2B35A9D98106FF72953941CC17840362F45AF251FC1A9B776A73BBEF69E9F568348C2F0; vst_usr_lg_token=EOEnV6giRkGbsPZqfVJs8Q==; _ga_EXMM0DKVEX=GS1.1.1676275817.1.1.1676275856.0.0.0; _ga=GA1.2.70802173.1668475499"
    },
    "referrer": "https://finance.vietstock.vn/ket-qua-kinh-doanh",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": "catID=0&industryID=0&code=&order=&__RequestVerificationToken=1fQIVecNb69fQDtMul9VM37hH02DE9WGec9sRvfZAPUoCmxxywnna_EcAxSjSVZ8do3T8gtkfuqxj4N2vM4izYvhUxdMlxnlXOVtUaBAbPHCkGiCoVDB6GjFr1tbT-640",
    "method": "POST",
    "mode": "cors"
  });

  let z = await kq.json();

  console.table(z)
  workbook = XLSX.utils.book_new();
  worksheet = XLSX.utils.json_to_sheet(z);

  XLSX.utils.book_append_sheet(workbook, worksheet);
  XLSX.writeFile(workbook, "KQKD.XLSX");
  console.log("written")
})();