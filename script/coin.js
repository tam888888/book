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
        page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
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
                          console.log(result);
            }

      

            request.continue();
          }).catch(error => {
            console.error(error);
            // request.abort();
          });
        });

        await page.setExtraHTTPHeaders({
            "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4882.194 Safari/537.36",
        })
        
        //45106424, 178997
        //"https://www.google.com/maps/search/spa/@21.0443653,105.8052909,12z/data=!3m1!4b1
        //page.goto("https://www.google.com/maps/search/Starbucks/@26.8484046,75.7215344,12z/data=!3m1!4b1"
        await page.goto("https://coinmarketcap.com/" , {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        })
    
        await page.waitForTimeout(5000)  
    
    // let data =  await scrollPage(page,".m6QErb[aria-label]",5000)
    
    console.log(data)
    // await browser.close();
    };
    
    getMapsData(); 
