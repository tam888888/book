import puppeteer from "puppeteer";
import request_client from 'request-promise-native'
import xlsx from "xlsx"
import fs from "fs";
import { Console } from 'node:console'
import { Transform } from 'node:stream'

const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk) } })
const log = new Console({ stdout: ts })

function getTable(data) {
  log.table(data)
  return (ts.read() || '').toString()
}


const extractItems = async (page) => {
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

const scrollPage = async (page, scrollContainer, itemTargetCount) => {
  let items = [];
  let previousHeight = await page.evaluate(`document.querySelector("${scrollContainer}").scrollHeight`);
  let lastLength = 0;
  let c = 0;
  while ((c <= 8) && (itemTargetCount > items.length)) {
    items = await extractItems(page);
    await page.evaluate(`document.querySelector("${scrollContainer}").scrollTo(0, document.querySelector("${scrollContainer}").scrollHeight)`);
    await page.evaluate(`document.querySelector("${scrollContainer}").scrollHeight > ${previousHeight}`);
    await page.waitForTimeout(500);
    console.log(items.length, c)
    if (lastLength < items.length) {
      lastLength = items.length
      c = 0;
    } else {
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
      if (request_url.includes("search?")) {
        result.push({
          request_url,
          request_headers,
          request_post_data,
          response_headers,
          response_size,
          response_body,
        });

        let z4 = JSON.parse(response_body.slice(0, response_body.length - 6))
        let z5 = JSON.parse(z4.d.slice(5))
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
  await page.goto("https://www.google.com/maps/search/Spa+in+C%E1%BB%95+nhu%E1%BA%BF+1,+B%E1%BA%AFc+T%E1%BB%AB+Li%C3%AAm,+H%C3%A0+N%E1%BB%99i", {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  })

  await page.waitForTimeout(5000)

  let data = await scrollPage(page, ".m6QErb[aria-label]", 5000)

  // console.log(data)
  await browser.close();
};

// getMapsData(); 


//load done
let done = {}

let cities = []

async function loadCitiesXls() {
  const workbook = xlsx.readFile('vietnam.xls');
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(worksheet);
  let head = ["province", "provinceCode", "district", "districtCode", "ward", "wardCode", "level", "name"]
  let head2 = ["Tỉnh Thành Phố", "Mã TP", "Quận Huyện", "Mã QH", "Phường Xã", "Mã PX", "Cấp", "Tên Tiếng Anh"]
  let newData = data.map(e => {
    let ne = {}
    head.forEach((key, i) => {
      if (e[head2[i]])
        ne[key] = e[head2[i]]
    })
    ne.address = ne.ward + " " + ne.district + " " + ne.province
    return ne;
  })

  let address = newData.map(e => JSON.stringify(e))
  if (!fs.existsSync("googlemaps"))
    fs.mkdirSync("googlemaps")
  fs.writeFileSync("googlemaps/cities.txt", address.join("\n"), 'utf8')

  return newData;
}

async function loadCities() {
  let buffer = fs.readFileSync("./vietnam.csv", "utf-8")
  let data = buffer.toString("utf8")
    .split('\n')
    .map(e => e.trim())
    .map(e => e.split(',').map(e => e.trim()));
  //data[0];
  let head = ["province", "provinceCode", "district", "districtCode", "ward", "wardCode", "name"]
  data = data.slice(1);
  data = data.map(e => {
    let x = {};
    for (let i = 0; i < head.length; i++) {
      if (e.length < head.length) {
        continue;
      }
      x[head[i].replaceAll("\"", "")] = e[i].replaceAll("\"", "");
    }
    x.address = x.ward + " " + x.district + " " + x.province
    return x;
  })

  let address = data.map(e => JSON.stringify(e))
  if (!fs.existsSync("googlemaps"))
    fs.mkdirSync("googlemaps")
  fs.writeFileSync("googlemaps/cities.txt", address.join("\n"), 'utf8')
  return data;
}

async function loadDone() {
  if (!fs.existsSync("googlemaps/done.txt")) return {};
  let buffer = fs.readFileSync("googlemaps/done.txt", "utf-8")
  let data = buffer.toString("utf8")
    .split('\n')
    .map(e => e.trim())
    .map(e => e.split(',').map(e => e.trim()));
  let d = {}
  data.forEach(e => {
    d[e] = e;
  })
  return d;
}

done = await loadDone();

// cities = await loadCities()

cities = await loadCitiesXls()
console.table(cities.slice(0, 10))

async function scraper() {
  var myArgs = process.argv.slice(2);
  var files = myArgs[0];
  if (!files) return;
  var tokens = files.split(",");
  console.table(tokens)
  let tokenData = tokens.map(e => {
    return { file: e, data: fs.readFileSync(e, "utf-8").split("\n").filter(e=>e.length>0).map(e => JSON.parse(e)) }
  })

  let r = null;
  let collec = {}
  let count = 0;

  let fetchData = async (query, ward, district, province, outFile) => {
    // let city = "Tỉnh kon tum"
    // let district = "huyện đắk tô thị trấn đắk tô"
    // let qq = "spa in " + city + " " + district
    let qq = encodeURIComponent(query)

    let urls = ['https://www.google.com/search?tbm=map&authuser=0&hl=en&pb=!4m12!1m3!1d83002.41826550964!2d105.74177272564789!3d21.053763740772258!2m3!1f0!2f0!3f0!3m2!1i879!2i1070!4f13.1!7i20!10b1!12m16!1m1!18b1!2m3!5m1!6e2!20e3!10b1!12b1!13b1!16b1!17m1!3e1!20m3!5e2!6b1!14b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m42!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e9!2b1!3e2!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!2b1!4b1!9b0!22m6!1s5rkDZckl64Pj4Q-t4IHIBQ%3A26!2s1i%3A0%2Ct%3A11887%2Cp%3A5rkDZckl64Pj4Q-t4IHIBQ%3A26!7e81!12e3!17s5rkDZckl64Pj4Q-t4IHIBQ%3A957!18e15!24m94!1m29!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m18!3b1!4b1!5b1!6b1!9b1!12b1!13b1!14b1!15b1!17b1!20b1!21b1!22b0!25b1!27m1!1b1!28b1!31b0!2b1!5m5!2b1!5b1!6b1!7b1!10b1!10m1!8e3!11m1!3e1!14m1!3b1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!29b1!30m1!2b1!36b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m2!1b1!3b1!65m5!3m4!1m3!1m2!1i224!2i298!71b1!72m17!1m5!1b1!2b1!3b1!5b1!7b1!4b1!8m8!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_reviews!9b1!89b1!103b1!113b1!26m4!2m3!1i80!2i92!4i8!30m28!1m6!1m2!1i0!2i0!2m2!1i530!2i1070!1m6!1m2!1i829!2i0!2m2!1i879!2i1070!1m6!1m2!1i0!2i0!2m2!1i879!2i20!1m6!1m2!1i0!2i1050!2m2!1i879!2i1070!34m18!2b1!3b1!4b1!6b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!37m1!1e81!42b1!47m0!49m7!3b1!6m2!1b1!2b1!7m2!1e3!2b1!50m4!2e2!3m2!1b1!3b1!61b1!67m2!7b1!10b1!69i662&q=#QUERY&oq=#QUERY&gs_l=maps.12...0.0.9.562666.0.0.....0.0..0.....0......maps..0.0.0.0.&tch=1&ech=17&psi=5rkDZckl64Pj4Q-t4IHIBQ.1694743015587.1', 'https://www.google.com/search?tbm=map&authuser=0&hl=en&gl=us&pb=!4m12!1m3!1d29787.14196525961!2d105.78047905!3d21.056966000000003!2m3!1f0!2f0!3f0!3m2!1i800!2i600!4f13.1!7i20!8i20!10b1!12m34!1m1!18b1!2m3!5m1!6e2!20e3!6m16!4b1!49b1!63m0!73m0!74i150000!75b1!85b1!89b1!91b1!110m0!114b1!149b1!169b1!170i6!176f8!179f90!10b1!12b1!13b1!14b1!16b1!17m1!3e1!20m3!5e2!6b1!14b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m42!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e9!2b1!3e2!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!2b1!4b1!9b0!22m2!1sTM8DZcaUPM7B0PEPr5WbmAQ!7e81!24m91!1m26!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m15!3b1!4b1!5b1!6b1!13b1!14b1!15b1!17b1!21b1!22b0!25b1!27m1!1b0!28b0!31b0!2b1!5m5!2b1!5b1!6b1!7b1!10b1!10m1!8e3!11m1!3e1!14m1!3b1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!29b1!30m1!2b1!36b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m2!1b1!3b1!65m5!3m4!1m3!1m2!1i224!2i298!71b1!72m17!1m5!1b1!2b1!3b1!5b1!7b1!4b1!8m8!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_reviews!9b1!89b1!103b1!113b1!26m4!2m3!1i80!2i92!4i8!30m28!1m6!1m2!1i0!2i0!2m2!1i530!2i600!1m6!1m2!1i750!2i0!2m2!1i800!2i600!1m6!1m2!1i0!2i0!2m2!1i800!2i20!1m6!1m2!1i0!2i580!2m2!1i800!2i600!34m19!2b1!3b1!4b1!6b1!7b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!37m1!1e81!42b1!46m1!1e1!47m0!49m7!3b1!6m2!1b1!2b1!7m2!1e3!2b1!50m25!1m21!2m7!1u3!4sOpen+now!5e1!9s0ahUKEwiWxKOP1quBAxXOIDQIHa_KBkMQ_KkBCO0GKBY!10m2!3m1!1e1!2m7!1u2!4sTop+rated!5e1!9s0ahUKEwiWxKOP1quBAxXOIDQIHa_KBkMQ_KkBCO4GKBc!10m2!2m1!1e1!3m1!1u2!3m1!1u3!4BIAE!2e2!3m1!3b1!59BQ2dBd0Fn!67m3!7b1!10b1!14b0!69i662&q=#QUERY&tch=1&ech=1&psi=TM8DZcaUPM7B0PEPr5WbmAQ.1694748494539.1', 'https://www.google.com/search?tbm=map&authuser=0&hl=en&gl=us&pb=!4m12!1m3!1d29787.14196525961!2d105.78047905!3d21.056966000000003!2m3!1f0!2f0!3f0!3m2!1i800!2i600!4f13.1!7i20!8i40!10b1!12m34!1m1!18b1!2m3!5m1!6e2!20e3!6m16!4b1!49b1!63m0!73m0!74i150000!75b1!85b1!89b1!91b1!110m0!114b1!149b1!169b1!170i6!176f8!179f90!10b1!12b1!13b1!14b1!16b1!17m1!3e1!20m3!5e2!6b1!14b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m42!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e9!2b1!3e2!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!2b1!4b1!9b0!22m2!1sTM8DZcaUPM7B0PEPr5WbmAQ!7e81!24m91!1m26!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m15!3b1!4b1!5b1!6b1!13b1!14b1!15b1!17b1!21b1!22b0!25b1!27m1!1b0!28b0!31b0!2b1!5m5!2b1!5b1!6b1!7b1!10b1!10m1!8e3!11m1!3e1!14m1!3b1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!29b1!30m1!2b1!36b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m2!1b1!3b1!65m5!3m4!1m3!1m2!1i224!2i298!71b1!72m17!1m5!1b1!2b1!3b1!5b1!7b1!4b1!8m8!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_reviews!9b1!89b1!103b1!113b1!26m4!2m3!1i80!2i92!4i8!30m28!1m6!1m2!1i0!2i0!2m2!1i530!2i600!1m6!1m2!1i750!2i0!2m2!1i800!2i600!1m6!1m2!1i0!2i0!2m2!1i800!2i20!1m6!1m2!1i0!2i580!2m2!1i800!2i600!34m19!2b1!3b1!4b1!6b1!7b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!37m1!1e81!42b1!46m1!1e1!47m0!49m7!3b1!6m2!1b1!2b1!7m2!1e3!2b1!50m25!1m21!2m7!1u3!4sOpen+now!5e1!9s0ahUKEwjlx7-T1quBAxXGFjQIHZMcCvUQ_KkBCPoGKBY!10m2!3m1!1e1!2m7!1u2!4sTop+rated!5e1!9s0ahUKEwjlx7-T1quBAxXGFjQIHZMcCvUQ_KkBCPsGKBc!10m2!2m1!1e1!3m1!1u3!3m1!1u2!4BIAE!2e2!3m1!3b1!59BQ2dBd0Fn!67m3!7b1!10b1!14b0!69i662&q=#QUERY&tch=1&ech=2&psi=TM8DZcaUPM7B0PEPr5WbmAQ.1694748494539.1', 'https://www.google.com/search?tbm=map&authuser=0&hl=en&gl=us&pb=!4m12!1m3!1d29787.14196525961!2d105.78047905!3d21.056966000000003!2m3!1f0!2f0!3f0!3m2!1i800!2i600!4f13.1!7i20!8i60!10b1!12m34!1m1!18b1!2m3!5m1!6e2!20e3!6m16!4b1!49b1!63m0!73m0!74i150000!75b1!85b1!89b1!91b1!110m0!114b1!149b1!169b1!170i6!176f8!179f90!10b1!12b1!13b1!14b1!16b1!17m1!3e1!20m3!5e2!6b1!14b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m42!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e9!2b1!3e2!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!2b1!4b1!9b0!22m2!1sTM8DZcaUPM7B0PEPr5WbmAQ!7e81!24m91!1m26!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m15!3b1!4b1!5b1!6b1!13b1!14b1!15b1!17b1!21b1!22b0!25b1!27m1!1b0!28b0!31b0!2b1!5m5!2b1!5b1!6b1!7b1!10b1!10m1!8e3!11m1!3e1!14m1!3b1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!29b1!30m1!2b1!36b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m2!1b1!3b1!65m5!3m4!1m3!1m2!1i224!2i298!71b1!72m17!1m5!1b1!2b1!3b1!5b1!7b1!4b1!8m8!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_reviews!9b1!89b1!103b1!113b1!26m4!2m3!1i80!2i92!4i8!30m28!1m6!1m2!1i0!2i0!2m2!1i530!2i600!1m6!1m2!1i750!2i0!2m2!1i800!2i600!1m6!1m2!1i0!2i0!2m2!1i800!2i20!1m6!1m2!1i0!2i580!2m2!1i800!2i600!34m19!2b1!3b1!4b1!6b1!7b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!37m1!1e81!42b1!46m1!1e1!47m0!49m7!3b1!6m2!1b1!2b1!7m2!1e3!2b1!50m25!1m21!2m7!1u3!4sOpen+now!5e1!9s0ahUKEwjKjZ6V1quBAxUFKH0KHZDMDXAQ_KkBCLEGKBY!10m2!3m1!1e1!2m7!1u2!4sTop+rated!5e1!9s0ahUKEwjKjZ6V1quBAxUFKH0KHZDMDXAQ_KkBCLIGKBc!10m2!2m1!1e1!3m1!1u3!3m1!1u2!4BIAE!2e2!3m1!3b1!59BQ2dBd0Fn!67m3!7b1!10b1!14b0!69i662&q=#QUERY&tch=1&ech=3&psi=TM8DZcaUPM7B0PEPr5WbmAQ.1694748494539.1', 'https://www.google.com/search?tbm=map&authuser=0&hl=en&gl=us&pb=!4m12!1m3!1d29787.14196525961!2d105.78047905!3d21.056966000000003!2m3!1f0!2f0!3f0!3m2!1i800!2i600!4f13.1!7i20!8i80!10b1!12m34!1m1!18b1!2m3!5m1!6e2!20e3!6m16!4b1!49b1!63m0!73m0!74i150000!75b1!85b1!89b1!91b1!110m0!114b1!149b1!169b1!170i6!176f8!179f90!10b1!12b1!13b1!14b1!16b1!17m1!3e1!20m3!5e2!6b1!14b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m42!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e9!2b1!3e2!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!2b1!4b1!9b0!22m2!1sTM8DZcaUPM7B0PEPr5WbmAQ!7e81!24m91!1m26!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m15!3b1!4b1!5b1!6b1!13b1!14b1!15b1!17b1!21b1!22b0!25b1!27m1!1b0!28b0!31b0!2b1!5m5!2b1!5b1!6b1!7b1!10b1!10m1!8e3!11m1!3e1!14m1!3b1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!29b1!30m1!2b1!36b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m2!1b1!3b1!65m5!3m4!1m3!1m2!1i224!2i298!71b1!72m17!1m5!1b1!2b1!3b1!5b1!7b1!4b1!8m8!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_reviews!9b1!89b1!103b1!113b1!26m4!2m3!1i80!2i92!4i8!30m28!1m6!1m2!1i0!2i0!2m2!1i530!2i600!1m6!1m2!1i750!2i0!2m2!1i800!2i600!1m6!1m2!1i0!2i0!2m2!1i800!2i20!1m6!1m2!1i0!2i580!2m2!1i800!2i600!34m19!2b1!3b1!4b1!6b1!7b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!37m1!1e81!42b1!46m1!1e1!47m0!49m7!3b1!6m2!1b1!2b1!7m2!1e3!2b1!50m25!1m21!2m7!1u3!4sOpen+now!5e1!9s0ahUKEwjs4eSW1quBAxUNGjQIHZZ7Bg0Q_KkBCL4GKBY!10m2!3m1!1e1!2m7!1u2!4sTop+rated!5e1!9s0ahUKEwjs4eSW1quBAxUNGjQIHZZ7Bg0Q_KkBCL8GKBc!10m2!2m1!1e1!3m1!1u3!3m1!1u2!4BIAE!2e2!3m1!3b1!59BQ2dBd0Fn!67m3!7b1!10b1!14b0!69i662&q=#QUERY&tch=1&ech=4&psi=TM8DZcaUPM7B0PEPr5WbmAQ.1694748494539.1', 'https://www.google.com/search?tbm=map&authuser=0&hl=en&gl=us&pb=!4m12!1m3!1d29787.14196525961!2d105.78047905!3d21.056966000000003!2m3!1f0!2f0!3f0!3m2!1i800!2i600!4f13.1!7i20!8i100!10b1!12m34!1m1!18b1!2m3!5m1!6e2!20e3!6m16!4b1!49b1!63m0!73m0!74i150000!75b1!85b1!89b1!91b1!110m0!114b1!149b1!169b1!170i6!176f8!179f90!10b1!12b1!13b1!14b1!16b1!17m1!3e1!20m3!5e2!6b1!14b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m42!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e9!2b1!3e2!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!2b1!4b1!9b0!22m2!1sTM8DZcaUPM7B0PEPr5WbmAQ!7e81!24m91!1m26!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m15!3b1!4b1!5b1!6b1!13b1!14b1!15b1!17b1!21b1!22b0!25b1!27m1!1b0!28b0!31b0!2b1!5m5!2b1!5b1!6b1!7b1!10b1!10m1!8e3!11m1!3e1!14m1!3b1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!29b1!30m1!2b1!36b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m2!1b1!3b1!65m5!3m4!1m3!1m2!1i224!2i298!71b1!72m17!1m5!1b1!2b1!3b1!5b1!7b1!4b1!8m8!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_reviews!9b1!89b1!103b1!113b1!26m4!2m3!1i80!2i92!4i8!30m28!1m6!1m2!1i0!2i0!2m2!1i530!2i600!1m6!1m2!1i750!2i0!2m2!1i800!2i600!1m6!1m2!1i0!2i0!2m2!1i800!2i20!1m6!1m2!1i0!2i580!2m2!1i800!2i600!34m19!2b1!3b1!4b1!6b1!7b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!37m1!1e81!42b1!46m1!1e1!47m0!49m7!3b1!6m2!1b1!2b1!7m2!1e3!2b1!50m25!1m21!2m7!1u3!4sOpen+now!5e1!9s0ahUKEwimoNKY1quBAxVRAjQIHS_4BHcQ_KkBCKwGKBY!10m2!3m1!1e1!2m7!1u2!4sTop+rated!5e1!9s0ahUKEwimoNKY1quBAxVRAjQIHS_4BHcQ_KkBCK0GKBc!10m2!2m1!1e1!3m1!1u3!3m1!1u2!4BIAE!2e2!3m1!3b1!59BQ2dBd0Fn!67m3!7b1!10b1!14b0!69i662&q=#QUERY&tch=1&ech=5&psi=TM8DZcaUPM7B0PEPr5WbmAQ.1694748494539.1']
    let u = 0;
    for (let url of urls) {
      // console.log("offset" + url)
      let uri = url.replaceAll("#QUERY", qq);
      u++;
      // console.log("offset" + uri)
      let options = {
        "headers": {
          "accept": "*/*",
          "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7",
          "sec-ch-ua": "\"Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"115\", \"Chromium\";v=\"115\"",
          "sec-ch-ua-arch": "\"x86\"",
          "sec-ch-ua-bitness": "\"64\"",
          "sec-ch-ua-full-version": "\"115.0.5790.171\"",
          "sec-ch-ua-full-version-list": "\"Not/A)Brand\";v=\"99.0.0.0\", \"Google Chrome\";v=\"115.0.5790.171\", \"Chromium\";v=\"115.0.5790.171\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-model": "\"\"",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-ch-ua-platform-version": "\"10.0.0\"",
          "sec-ch-ua-wow64": "?0",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-client-data": "CJe2yQEIorbJAQipncoBCKOTywEIlKHLAQiFoM0BCI2nzQEI3L3NAQjfxM0BCLXFzQEIxMjNAQi5ys0BCLfNzQEIk8/NAQjU0M0B",
          "x-goog-ext-353267353-jspb": "[null,null,null,147535]",
          "x-maps-diversion-context-bin": "CAE=",
          "cookie": "HSID=AzGQQfneG9w4ZOChy; SSID=AIYD-RAtp5kcKMtNG; APISID=6PhvwY3dbnVugDJ0/AQJ2m5CTSnpuhWLVh; SAPISID=HM29REOJ5QhA7ECF/AA2zvqN4jyZy1u8_T; __Secure-1PAPISID=HM29REOJ5QhA7ECF/AA2zvqN4jyZy1u8_T; __Secure-3PAPISID=HM29REOJ5QhA7ECF/AA2zvqN4jyZy1u8_T; SID=[SC]CgUNRT0AAJoGDENBRVFBeGlBbUFFPaIGmQEAfj4Jaob-MoHtQr5EyENBc1fG09Yqpv7TtSLvDSiW5rr-jNqot_aklqzTbZnADDdbG78bNH8Ruu42oSShRYDiQ6Bu3qIcG1qSAhbYxlx7oXfBqT7pWHteCDvuKTNaGjfVYGMz5NEG9njghlUO5UnNiQXbw_o-BqOHsw8nBOV0lq8y2DvHBxm4VspcNZSqTgQHtI0Y42lVWziqBoABMzg4MWE0NGU4MGUzZDkxYWZlZTcyYmYxY2RjOGJjZGIzMmZhZTQ4MWRjMTZkNzIzYjYyZDk1NDFhYmJjNWY0MmRlMDA2MGY3OWFmNWNmZTY3ZWU5MDhlNzBmODQyZTI3MDhiMmI5ZWNjZmNiMmVlZDk0MzRjNmM4YzdjMDE0ODI; __Secure-1PSID=[SC]CgUNRT0AAJoGDENBRVFBeGlBbUFFPaIGmQEAfj4JaqO12s-QS4C-JrbA8Sfp2W1OPJJy8cizG1PDtqx-45Gh8XpYc_mhTQlpdd6YZa0ZmTmkIRPyo2cxxpDGANtGezLQAfE1GlMofEEyN5ckDUnsgqbmMeSjBMOPkdiq7zM2QTVxlTgniIGVWXr6Cses7UklPlVv364VzB4e38wwDt5RpnHS3Qh7s89zX7-zJt6d1AJ3pciqBoABMWYzYzBjOWY2OGJmOGQ3ZGRhM2NlZGZhYjM5MTRhN2FhYWJiN2QyZjkzMTNhN2RiNzdmYzMwNmU1MDIxNDAwYTI3MjBkNDIzZDdjZDc5YWYzNjUzNjYyMWQ1ZmE4MDhlNDI1MTg5ZjZiNDRhMzA5ZmM0NDhkMzhjZGE0OWZjNzQ; __Secure-3PSID=[SC]CgUNRT0AAJoGDENBRVFBeGlBbUFFPaIGmQEAfj4JaiAxmjWqw36O6VY3vbjMUq_mkvY14EZwjJP0VeEWAEm1rVJXOmES2VFzUkKNNURJchKOv8CtNxvtThQ8wIjMTbac6MpwZi4o8Sn5NZ5dvjWrPW3kTPQokr722NPIZT5N-2ordXfA3Ztp-guKhXj3q1dT-GOrJ8YcfbIgL0j7q8Y9oGwJRBIaM1oNT_x40LU5pXwnZ7eqBoABZjI4ZTlhY2JmYWNlYjQwYjk5OTdhY2JmMDgxZjFhYmZlZTBmNmZhNmYzMjFkZDY3NzQ1NGQyNTFmYzVhZjA1NzNiYzRhZDAyZjcyN2VlYjgyYmRiY2I5OGExOGU5ZTZjNzFiZWQ5ZWFiODkzNGM0N2U3NTA4NGI3Y2ZmNjY4MmE; SIDCC=AFvIBn8bM1avbvpGz1B7ll7mg1tZGa4X62lurkkv5vvqifTOszCus7zHlTyDYQLACjF0G4np_Z4; __Secure-1PSIDCC=AFvIBn8M-1ogJmChxA42CyK1hXOkxCdSnqVxNq7HhWxVctVmlGDS4dJrIEt-6IU-1Cbdgdiy1Ns; __Secure-3PSIDCC=AFvIBn-toKW8E_sny0gYgNaU0oYx6HLUDirFSphKBukuhlEaqSDuX8MbP019V8MDMORQ3ys2LXKR; OTZ=7204612_28_28__28_; AEC=Ad49MVE2s9j4ONAspwCutnp_tUCzsBk-kIlW_z2McSsOuNCij1QAyGwxhn4; NID=511=fVNb3VItoOew7T_5r6qIKbkDfTpJ_MYxudVYZfwGcKuAN5cdYWnTR0nzoPt-UO3dteUSiQgPnwCrElhz0vAhEASCnxpmzluRA6zcYhOD_nM2kSh-RspcAVXnOdS56dd8EHzcYm23LIToNZyG-zj6JQ7eSq923DEBaSF7Y9fOXU0lyY7d9zh0KkYEMTE9yTVSym6OL3Bh0LuG5EoXOS0bdxi93Q; 1P_JAR=2023-09-14-11",
          "Referer": "https://www.google.com/",
          "Referrer-Policy": "origin"
        },
        "body": null,
        "method": "GET"
      }
      let aa = await fetch(uri, options);


      let z = await aa.text()
      console.log(u, query, z.slice(0, 100))
      // if (!z.startsWith("{")) return;
      while (!z.startsWith("{")) {
        await wait(50000)
        aa = await fetch(uri, options);
        z = await aa.text()
        console.log(u, query, z.slice(0, 100))
      }

      let z4 = JSON.parse(z.slice(0, z.length - 6))
      let z5 = JSON.parse(z4.d.slice(5))
      //console.log(JSON.stringify(z5[0][1][1][14]))
      for (let i = 1; i < z5[0][1].length; i++) {
        count++;
        let record = z5[0][1][i][14]
        r = record
        // console.log("i", i, record)
        let idd = {
          id: record[227][0][0], tel: record[178] == null ? null : record[178][0][0],
          spa: record[11],
          name: record[183] == null ? null : record[183][0][1][1][0][0], name2: record[18],  
        }

        if(record[9]){
          idd = {...idd,     lat: record[9][2], lon: record[9][3],}
        }

        if (record[2]) {

          idd = {
            ...idd,
            add: record[2][0],
            ward: record[2][1],
            dist: record[2][2],
            province: record[2][3],
            ward2: ward,
            dist2: district,
            province2: province
          }
        }
        collec[idd.id] = idd

        fs.appendFileSync(outFile, JSON.stringify(idd) + "\n")
        if (count % 10 == 0)
          console.log("Tong so ban ghi " + Object.keys(collec).length, "count", count)

        if (Object.keys(collec).length % 100 == 0) {
          // fs.writeFileSync("googlemaps/spa.json", JSON.stringify(Object.values(collec)))
          let table = getTable(Object.values(collec))
          fs.writeFileSync("googlemaps/table.text", table, "utf-8")
        }
      }

    }

    makeDone(query)
  }

  let start = Date.now()
  for (let token of tokenData) {
    let c = 0;
    for (let edata of token.data) {
      c++;
      console.log(edata)
      // await wait(500)
      let query = "spa in " + edata.address;
      if (done[query]) continue;

      await fetchData(query, edata.ward, edata.district, edata.province, token.file + "_out.txt")


      if (c == token.data.length) {
        console.log("Done ", token.file, " total ", c)

      }
      if (c % 2 == 0) {
        console.log("Done ", token.file, " count ", c, " total ", token.data.length)
        let time = (Date.now() - start) / 1000;
        console.log("Time ", time, " seconds ", " ~ ", time / 60, " minutes ", " remain ", time / 60 * (token.data.length - c) / c, " minutes ")
      }
    }
  }



}

function makeDone(query) {
  fs.appendFileSync("googlemaps/done.txt", query + "\n")
}

function writeArrayJson2Xlsx(filename, array) {
  let workbook = xlsx.utils.book_new();
  let worksheet = xlsx.utils.json_to_sheet(array);
  xlsx.utils.book_append_sheet(workbook, worksheet);
  xlsx.writeFile(workbook, filename);
}

scraper();


function wait(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(0);
    }, ms);
  });
}