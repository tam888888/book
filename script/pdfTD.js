
import { Exchange } from "./Exchange.js";
import fetch from "node-fetch";
import fs from "fs";
import path, { resolve } from "path";
import { writeFile } from "fs/promises"
import pdf from "pdfjs-dist/legacy/build/pdf.js";
import xlsx from "xlsx"

function writeArrayJson2Xlsx(filename, array) {
    let workbook = xlsx.utils.book_new();
    let worksheet = xlsx.utils.json_to_sheet(array);
    xlsx.utils.book_append_sheet(workbook, worksheet);
    xlsx.writeFile(workbook, filename);
}


//https://static2.vietstock.vn/vietstock/2022/12/1/20221201_20221201___thong_ke_giao_dich_tu_doanh.pdf
//https://static2.vietstock.vn/vietstock/2022/9/8/20220908_20220908___thong_ke_giao_dich_tu_doanh.pdf
function url(date) {
    let t = date.getFullYear() + ""
        + (date.getMonth() + 1 < 10 ? ("0" + (date.getMonth() + 1)) : date.getMonth() + 1) + ""
        + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate())
    let file = t + '_' + t + '___thong_ke_giao_dich_tu_doanh.pdf';
    const url = 'https://static2.vietstock.vn/vietstock/' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + '/' + file;
    return { url, file };
}

function date2str(date) {
    let t = date.getFullYear() + ""
        + (date.getMonth() + 1 < 10 ? ("0" + (date.getMonth() + 1)) : date.getMonth() + 1) + ""
        + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate())    
    let file = t + '_' + t + '___thong_ke_giao_dich_tu_doanh.pdf';
    return file;
}
(async () => {
    let dir = "./pdf";
    let req = 0;
    let res = 0;
    for (var i = 1; i < 10; i++) {
        let x = url(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
        const response = fetch(x.url);
        req++;
        response.then(rs => rs.buffer()).then(async (buffer) => {
            if (buffer.length > 500) {
                await writeFile(dir + "/" + x.file, buffer);
                console.log(x.file)
                console.log(x.url)
            }
            res++;
        }
        )
        while (req - res > 10) {
            await wait(100);
        }
    }
    console.log('Done!');
})
    ();


function wait(ms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(0);
        }, ms);
    });
}


(async () => {





    let dir = "./pdf";
    let files = fs.readdirSync(dir);

    // files = [
    //     "20220818_20220818___thong_ke_giao_dich_tu_doanh.pdf",
    //     "20221108_20221108___thong_ke_giao_dich_tu_doanh.pdf",
    //     "20220912_20220912___thong_ke_giao_dich_tu_doanh.pdf",
    // ]


    let total = {};
    //'20230112', '20230111', '20230110', '20230109', '20230108'
    let whitelist = ['20230606']

    let recently = 200;
    let check = {};
    let fileFiltered = [];
    for (let file of files) {
        check[file] = 0;
    }

    for (var i = 0; i < 200; i++) {
        let x = date2str(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
        console.log(x)
        if (check[x] != undefined) {
            fileFiltered.push(x);
            if (fileFiltered.length == recently) {
                break;
            }
        }
    }
    files = fileFiltered;
    for (let file of files) {
        if (file.includes("20230608")
            // || file.includes("202206")
            // || file.includes("202207")
            // || file.includes("202208")
            // || file.includes("202209")
            // || file.includes("202210")
            // || file.includes("202211")
            // || file.includes("202212")
            // || file.includes("2022120")
            // || file.includes("2022121")
        ) {
            continue;
        }
        if (whitelist != undefined && whitelist.length > 0) {
            let out = true;
            for (let p of whitelist) {
                if (file.includes(p)) {
                    out = false;
                    break;
                }
            }
            if (out) {
                continue;
            }
        }
        console.log(file.substring(0, 8));

        let sum = [];
        let record = [, , , , , , , , ,];
        const loadingTask = pdf.getDocument(path.join(dir, file));
        const doc = await loadingTask.promise;

        console.log(doc.numPages);

        let txt1 = [22.939, 401.685, 54.68, 414.359]
        let txt2 = [54.18, 401.868, 111.795, 414.541]
        let txt3 = [110.766, 402.094, 185.016, 414.768]
        let txt4 = [184.611, 401.868, 258.861, 414.541]
        let txt5 = [258.455, 402.277, 332.705, 414.95]
        let txt6 = [331.893, 401.868, 404.115, 414.95]
        let txt7 = [404.52, 401.138, 476.742, 414.629]
        let txt8 = [478.365, 401.503, 550.586, 414.994]
        let txt9 = [551.209, 401.277, 623.43, 414.768]
        let txt10 = [624.836, 402.094, 697.557, 415.585]
        let txt11 = [697.557, 402.094, 697.557, 415.585]

        // let text = await (await doc.getPage(1)).getTextContent();
        // let anno = await (await doc.getPage(1)).getAnnotations();

        let items = [];
        let done = 0;
        let promise = new Promise((resolve, reject) => {


            for (let p = 1; p <= doc.numPages; p++) {
                doc.getPage(p).then(page => page.getTextContent()).then(content => {
                    for (let i of content.items) {
                        i["P"] = p;
                        items.push(i);
                    }
                    done++;
                    // console.log(content.items);
                    if (done == doc.numPages) {
                        resolve(items);
                    }
                })
            }
        })

        await promise;
        items = items.sort((a, b) => {
            let r =
                a.P > b.P ? 1 : a.P < b.P ? -1 : (a.transform[5] > b.transform[5] ? -1 : a.transform[5] < b.transform[5] ? 1 :
                    (a.transform[4] > b.transform[4] ? 1 : a.transform[4] < b.transform[4] ? -1 : 0));
            // console.log(r);
            return r

        })

        const SGD = "SỞ GIAO DỊCH CHỨNG KHOÁN TP. HỒ CHÍ MINH";
        let next = 0;
        let END = null;
        for (let t of items) {
            if (t.str == SGD) {
                if (next > 0) {
                    END = t;
                    break;
                }
                next++;
            }
            // console.log(t.str, t.width, t.transform, t.P);
        }

        let l = items.filter((e, i) => {
            return e.P < END.P;
        })

        let decode = (record, idx, val, e1, e2) => {
            // console.log(val.str,val.transform,val.transform[4], e1[0], e2[0]);
            if (val.transform[4] >= e1[0] && val.transform[4] < e2[0]) {
                // console.log(val.str);
                record[idx] = val.str;
                // record[idx] = +(val.str.replace(/,/g, ''))
            }
        }
        sum = [];
        l.forEach((val, idx) => {
            if (val.transform[5] >= txt1[1] && val.P <= 1) {
                return;
            }


            if (val.str == ' ') {
                return;
            }
            if (val.transform[4] >= txt2[0] && val.transform[4] < txt3[0]) {
                // console.log(val.str, "================================", val.str.length);
                sum.push(record);
                record = [, , , , , , , , ,];
            }
            decode(record, 0, val, txt2, txt3); //Sy
            decode(record, 1, val, txt3, txt4); //M1
            decode(record, 2, val, txt4, txt5); //B1
            decode(record, 3, val, txt5, txt6); //M2
            decode(record, 4, val, txt6, txt7); //B2
            decode(record, 5, val, txt7, txt8); //M3
            decode(record, 6, val, txt8, txt9); //B3
            decode(record, 7, val, txt9, txt10); //B4
            decode(record, 8, val, txt10, txt11);
        });

        sum.push(record) //last

        for (let e of sum) {
            // console.log(e);
        }

        let head = sum[0];


        console.log(head);

        head.forEach((v, i) => {
            if (v == undefined) {
                return;
            }
            let zz = sum.filter((e) => { return e[i] != undefined }).map(e => +(e[i].replace(/,/g, '')));
            // let zz = sum.filter((e) => { return e[i] != undefined }).map(e => e);
            let v1 = zz.slice(1);
            let v2 = v1.reduce((a, b) => a + b, 0)
            if (v2 != +(v.replace(/,/g, ''))) {
                // if (v2 != v) {
                console.log("Co sai du lieu ===========================================", i, v, v2)
                // console.log(zz);
            } else {
                // console.log("Ok  ", i, v, v2)
            }
        })


        total[file.substring(0, 8)] = sum;

    }


    // console.log(Object.keys(total));

    console.table(Object.values(total).at(-1))


    let summarySymbol = {};
    let arraySymbol = []
    let maxDate = undefined;
    let maxDateStr = "";

    for (let k of Object.keys(total)) {
        // console.log(k);
        let data = total[k];
        // if (!arraySymbol[k]) arraySymbol[k] = []
        data.forEach((v, i) => {
            if (i = 0) return;
            let t = summarySymbol[v[0]];
            if (t == undefined) {
                t = [0, 0, 0, 0, 0, 0, 0, 0,];
                summarySymbol[v[0]] = t;
            }

            for (i = 1; i <= 4; i++) {
                if (v[i] != undefined)
                    t[i - 1] += +(v[i].replace(/,/g, ''));
            }

            let a = [];
            a[0] = v[0]
            for (let ii = 1; ii < v.length; ii++) {
                if (v[ii]) a[ii] = +(v[ii].replace(/,/g, ''));
            }
            // console.log(k.slice(0,4),(k.slice(4,6)),k.slice(6,8))
            let temp = {
                mkl: a[1],
                bkl: a[2],
                mvkl: a[3],
                bvkl: a[4],
                mtt: a[5],
                btt: a[6],
                mvtt: a[7],
                bvtt: a[8],
            }
            let d = new Date(+k.slice(0, 4), (+k.slice(4, 6) - 1), +k.slice(6, 8));
            if (!maxDate) {
                maxDate = d;
                maxDateStr = k;
            }
            if (maxDate < d) {
                maxDate = d;
                maxDateStr = k;
            }
            let td = { date: k, datetime: d, symbol: a[0] }
            for (let k in temp) {
                if (temp[k]) td[k] = temp[k]
            }

            arraySymbol.push(td)


        });
    }

    let symbols = [];
    for (let k of Object.keys(summarySymbol)) {
        let d = summarySymbol[k];
        symbols.push(
            {
                symbol: k,
                mkl: d[0],
                bkl: d[1],
                mvkl: d[2],
                bvkl: d[3],
                mtt: d[4],
                btt: d[5],
                mvtt: d[6],
                bvtt: d[7],
            }
        );
    }

    // console.log(summarySymbol)


    // console.table(Object.values(arraySymbol).at(-1))

    writeArrayJson2Xlsx("./filter/" + "TD_" + maxDateStr + ".xlsx", arraySymbol)
    fs.writeFile("symbol.json", JSON.stringify(symbols, (k, v) => {
        return v;
    }, ''), (e) => { });

})();