import puppeteer from "puppeteer";
import request_client from 'request-promise-native'
// const puppeteer = require("puppeteer"); /// import puppeteer from "puppeteer";
// const xlsx = require("xlsx");
import xlsx from "xlsx"
// const puppeteer = require('puppeteer');
// const puppeteer = require('puppeteer');

    const extractItems = async(page)  => {
        let maps_data = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".Nv2PK")).map((el) => {
            const link = el.querySelector("a.hfpxzc").getAttribute("href");
            return {
            title: el.querySelector(".qBF1Pd")?.textContent.trim(),
            avg_rating: el.querySelector(".MW4etd")?.textContent.trim(),
            reviews: el.querySelector(".UY7F9")?.textContent.replace("(", "").replace(")", "").trim(),
            address: el.querySelector(".W4Efsd:last-child > .W4Efsd:nth-of-type(1) > span:last-child")?.textContent.replaceAll("·", "").trim(),
            description: el.querySelector(".W4Efsd:last-child > .W4Efsd:nth-of-type(2)")?.textContent.replace("·", "").trim(),
            website: el.querySelector("a.lcr4fd")?.getAttribute("href"),
            category: el.querySelector(".W4Efsd:last-child > .W4Efsd:nth-of-type(1) > span:first-child")?.textContent.replaceAll("·", "").trim(),
            timings: el.querySelector(".W4Efsd:last-child > .W4Efsd:nth-of-type(3) > span:first-child")?.textContent.replaceAll("·", "").trim(),
            phone_num: el.querySelector(".W4Efsd:last-child > .W4Efsd:nth-of-type(3) > span:last-child")?.textContent.replaceAll("·", "").trim(),
            extra_services: el.querySelector(".qty3Ue")?.textContent.replaceAll("·", "").replaceAll("  ", " ").trim(),
            latitude: link.split("!8m2!3d")[1].split("!4d")[0],
            longitude: link.split("!4d")[1].split("!16s")[0],
            link,
            dataId: link.split("1s")[1].split("!8m")[0],
            };
        });
        });
        return maps_data;
        }
    
        const scrollPage = async(page, scrollContainer, itemTargetCount) => {
        let items = [];
        let previousHeight = await page.evaluate(`document.querySelector("${scrollContainer}").scrollHeight`);
        let lastLength = 0;
        let c = 0;
        while ((c <= 8) && (itemTargetCount > items.length)) {
            items = await extractItems(page);
            await page.evaluate(`document.querySelector("${scrollContainer}").scrollTo(0, document.querySelector("${scrollContainer}").scrollHeight)`);
            await page.evaluate(`document.querySelector("${scrollContainer}").scrollHeight > ${previousHeight}`);
            await page.waitForTimeout(500);
            console.log(items.length,c)
            if(lastLength < items.length){
              lastLength = items.length
              c = 0;
            }else{
              c++;
            }            
            
        }
        return items;
        }
    
    
    
    const getMapsData = async () => {
      const browser = await puppeteer.launch();
        const [page] = await browser.pages();
        // page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
        const result = [];

        await page.setRequestInterception(true);
      
        page.on('request', request => {
          request_client({
            uri: request.url(),
            resolveWithFullResponse: true,
          }).then(response => {
            const request_url = request.url();
            const request_headers = request.headers();
            const request_post_data = request.postData();
            const response_headers = response.headers;
            const response_size = response_headers['content-length'];
            const response_body = response.body;
            if(request_url.includes("search?")){
              result.push({
                request_url,
                request_headers,
                request_post_data,
                response_headers,
                response_size,
                response_body,
              });
              
             let z4= JSON.parse(response_body.slice(0,response_body.length-6))
             let z5=JSON.parse(z4.d.slice(5))
              // console.log(JSON.stringify(z5[0][1][1][14]));
              console.log(request_url)
            }

      

            request.continue();
          }).catch(error => {
            // console.error(error);
            request.abort();
          });
        });

        await page.setExtraHTTPHeaders({
            "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4882.194 Safari/537.36",
        })
        
        //10.7756	106.7019
        //https://www.google.com/maps/search/spa/@10.7756,106.7019,12z/data=!3m1!4b1
        //"https://www.google.com/maps/search/spa/@21.0443653,105.8052909,12z/data=!3m1!4b1
        //page.goto("https://www.google.com/maps/search/Starbucks/@26.8484046,75.7215344,12z/data=!3m1!4b1"
        //https://www.google.com/maps/search/Spa+in+C%E1%BB%95+nhu%E1%BA%BF+1,+B%E1%BA%AFc+T%E1%BB%AB+Li%C3%AAm,+H%C3%A0+N%E1%BB%99i
        await page.goto("https://www.google.com/maps/search/Spa+in+C%E1%BB%95+nhu%E1%BA%BF+1,+B%E1%BA%AFc+T%E1%BB%AB+Li%C3%AAm,+H%C3%A0+N%E1%BB%99i" , {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        })
    
        await page.waitForTimeout(5000)  
    
    let data =  await scrollPage(page,".m6QErb[aria-label]",5000)
    
    // console.log(data)
    await browser.close();
    };
    
    getMapsData(); 



    
// let city = "Thành phố Hà Nội"
// let district = "Huyện Đông Anh"
// let qq = city + " " + district
// qq = encodeURIComponent(qq)

// let aa = await fetch("https://www.google.com/search?tbm=map&authuser=0&hl=en&pb=!4m12!1m3!1d663001.6800933856!2d105.50199322437034!3d21.28071124300518!2m3!1f0!2f0!3f0!3m2!1i879!2i1070!4f13.1!7i20!10b1!12m16!1m1!18b1!2m3!5m1!6e2!20e3!10b1!12b1!13b1!16b1!17m1!3e1!20m3!5e2!6b1!14b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m42!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e9!2b1!3e2!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!2b1!4b1!9b0!22m6!1sn-8CZbCbEcaL-AadwYeoBQ%3A4!2s1i%3A0%2Ct%3A11886%2Cp%3An-8CZbCbEcaL-AadwYeoBQ%3A4!7e81!12e5!17sn-8CZbCbEcaL-AadwYeoBQ%3A143!18e15!24m94!1m29!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m18!3b1!4b1!5b1!6b1!9b1!12b1!13b1!14b1!15b1!17b1!20b1!21b1!22b0!25b1!27m1!1b1!28b1!31b0!2b1!5m5!2b1!5b1!6b1!7b1!10b1!10m1!8e3!11m1!3e1!14m1!3b1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!29b1!30m1!2b1!36b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m2!1b1!3b1!65m5!3m4!1m3!1m2!1i224!2i298!71b1!72m17!1m5!1b1!2b1!3b1!5b1!7b1!4b1!8m8!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_reviews!9b1!89b1!103b1!113b1!26m4!2m3!1i80!2i92!4i8!30m28!1m6!1m2!1i0!2i0!2m2!1i530!2i1070!1m6!1m2!1i829!2i0!2m2!1i879!2i1070!1m6!1m2!1i0!2i0!2m2!1i879!2i20!1m6!1m2!1i0!2i1050!2m2!1i879!2i1070!34m18!2b1!3b1!4b1!6b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!37m1!1e81!42b1!47m0!49m7!3b1!6m2!1b1!2b1!7m2!1e3!2b1!50m4!2e2!3m2!1b1!3b1!61b1!67m2!7b1!10b1!69i662&q="+qq+"&oq="+qq+"&gs_l=maps.3..38i429k1l2j38i426k1l3.0.0.3.10967.1.1.....98.98.1.1.....0......maps..0.1.106.0.&tch=1&ech=3&psi=n-8CZbCbEcaL-AadwYeoBQ.1694691232686.1", {
//   "headers": {
//     "accept": "*/*",
//     "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7",
//     "sec-ch-ua": "\"Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"115\", \"Chromium\";v=\"115\"",
//     "sec-ch-ua-arch": "\"x86\"",
//     "sec-ch-ua-bitness": "\"64\"",
//     "sec-ch-ua-full-version": "\"115.0.5790.171\"",
//     "sec-ch-ua-full-version-list": "\"Not/A)Brand\";v=\"99.0.0.0\", \"Google Chrome\";v=\"115.0.5790.171\", \"Chromium\";v=\"115.0.5790.171\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-model": "\"\"",
//     "sec-ch-ua-platform": "\"Windows\"",
//     "sec-ch-ua-platform-version": "\"10.0.0\"",
//     "sec-ch-ua-wow64": "?0",
//     "sec-fetch-dest": "empty",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "same-origin",
//     "x-client-data": "CJe2yQEIorbJAQipncoBCKOTywEIlKHLAQiFoM0BCI2nzQEI3L3NAQjfxM0BCLXFzQEIxMjNAQi5ys0BCLfNzQEIk8/NAQjU0M0B",
//     "x-goog-ext-353267353-jspb": "[null,null,null,147535]",
//     "x-maps-diversion-context-bin": "CAE=",
//     "cookie": "HSID=AzGQQfneG9w4ZOChy; SSID=AIYD-RAtp5kcKMtNG; APISID=6PhvwY3dbnVugDJ0/AQJ2m5CTSnpuhWLVh; SAPISID=HM29REOJ5QhA7ECF/AA2zvqN4jyZy1u8_T; __Secure-1PAPISID=HM29REOJ5QhA7ECF/AA2zvqN4jyZy1u8_T; __Secure-3PAPISID=HM29REOJ5QhA7ECF/AA2zvqN4jyZy1u8_T; SID=[SC]CgUNRT0AAJoGDENBRVFBeGlBbUFFPaIGmQEAfj4Jaob-MoHtQr5EyENBc1fG09Yqpv7TtSLvDSiW5rr-jNqot_aklqzTbZnADDdbG78bNH8Ruu42oSShRYDiQ6Bu3qIcG1qSAhbYxlx7oXfBqT7pWHteCDvuKTNaGjfVYGMz5NEG9njghlUO5UnNiQXbw_o-BqOHsw8nBOV0lq8y2DvHBxm4VspcNZSqTgQHtI0Y42lVWziqBoABMzg4MWE0NGU4MGUzZDkxYWZlZTcyYmYxY2RjOGJjZGIzMmZhZTQ4MWRjMTZkNzIzYjYyZDk1NDFhYmJjNWY0MmRlMDA2MGY3OWFmNWNmZTY3ZWU5MDhlNzBmODQyZTI3MDhiMmI5ZWNjZmNiMmVlZDk0MzRjNmM4YzdjMDE0ODI; __Secure-1PSID=[SC]CgUNRT0AAJoGDENBRVFBeGlBbUFFPaIGmQEAfj4JaqO12s-QS4C-JrbA8Sfp2W1OPJJy8cizG1PDtqx-45Gh8XpYc_mhTQlpdd6YZa0ZmTmkIRPyo2cxxpDGANtGezLQAfE1GlMofEEyN5ckDUnsgqbmMeSjBMOPkdiq7zM2QTVxlTgniIGVWXr6Cses7UklPlVv364VzB4e38wwDt5RpnHS3Qh7s89zX7-zJt6d1AJ3pciqBoABMWYzYzBjOWY2OGJmOGQ3ZGRhM2NlZGZhYjM5MTRhN2FhYWJiN2QyZjkzMTNhN2RiNzdmYzMwNmU1MDIxNDAwYTI3MjBkNDIzZDdjZDc5YWYzNjUzNjYyMWQ1ZmE4MDhlNDI1MTg5ZjZiNDRhMzA5ZmM0NDhkMzhjZGE0OWZjNzQ; __Secure-3PSID=[SC]CgUNRT0AAJoGDENBRVFBeGlBbUFFPaIGmQEAfj4JaiAxmjWqw36O6VY3vbjMUq_mkvY14EZwjJP0VeEWAEm1rVJXOmES2VFzUkKNNURJchKOv8CtNxvtThQ8wIjMTbac6MpwZi4o8Sn5NZ5dvjWrPW3kTPQokr722NPIZT5N-2ordXfA3Ztp-guKhXj3q1dT-GOrJ8YcfbIgL0j7q8Y9oGwJRBIaM1oNT_x40LU5pXwnZ7eqBoABZjI4ZTlhY2JmYWNlYjQwYjk5OTdhY2JmMDgxZjFhYmZlZTBmNmZhNmYzMjFkZDY3NzQ1NGQyNTFmYzVhZjA1NzNiYzRhZDAyZjcyN2VlYjgyYmRiY2I5OGExOGU5ZTZjNzFiZWQ5ZWFiODkzNGM0N2U3NTA4NGI3Y2ZmNjY4MmE; SIDCC=AFvIBn8bM1avbvpGz1B7ll7mg1tZGa4X62lurkkv5vvqifTOszCus7zHlTyDYQLACjF0G4np_Z4; __Secure-1PSIDCC=AFvIBn8M-1ogJmChxA42CyK1hXOkxCdSnqVxNq7HhWxVctVmlGDS4dJrIEt-6IU-1Cbdgdiy1Ns; __Secure-3PSIDCC=AFvIBn-toKW8E_sny0gYgNaU0oYx6HLUDirFSphKBukuhlEaqSDuX8MbP019V8MDMORQ3ys2LXKR; OTZ=7204612_28_28__28_; AEC=Ad49MVE2s9j4ONAspwCutnp_tUCzsBk-kIlW_z2McSsOuNCij1QAyGwxhn4; NID=511=fVNb3VItoOew7T_5r6qIKbkDfTpJ_MYxudVYZfwGcKuAN5cdYWnTR0nzoPt-UO3dteUSiQgPnwCrElhz0vAhEASCnxpmzluRA6zcYhOD_nM2kSh-RspcAVXnOdS56dd8EHzcYm23LIToNZyG-zj6JQ7eSq923DEBaSF7Y9fOXU0lyY7d9zh0KkYEMTE9yTVSym6OL3Bh0LuG5EoXOS0bdxi93Q; 1P_JAR=2023-09-14-11",
//     "Referer": "https://www.google.com/",
//     "Referrer-Policy": "origin"
//   },
//   "body": null,
//   "method": "GET"
// });


// let z = await aa.text()

// z4=JSON.parse(z.slice(0,z.length-6))
// z5=JSON.parse(z4.d.slice(5))


