
import { Exchange } from "./Exchange.js";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import extract from "pdf-text-extract"
import { PdfReader } from "pdfreader";
import PDFParser from "pdf2json";
import { writeFile } from "fs/promises"
// import { fs } from "fs/promises"
import { PDFDocument } from 'pdf-lib'
import { PDFRawStream, decodePDFRawStream } from 'pdf-lib'
import { Console } from "console";
import pdf from "pdfjs-dist/legacy/build/pdf.js";
import PDFPageProxy from "pdfjs-dist/legacy/build/pdf.js";

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
(async () => {
    let dir = "./pdf";
    let req = 0;
    let res = 0;
    for (var i = 400; i < 1000; i++) {
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
        // const buffer = await response.buffer();
        // if (buffer.length > 500) {
        //     await writeFile(dir + "/" + x.file, buffer);
        //     console.log(x.file)
        //     console.log(x.url)
        // }
    }
    console.log('Done!');
})
// ();


function wait(ms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(0);
        }, ms);
    });
}

(async () => {

    let d = new Date();

    console.log(Date.now())
    console.log(d.getFullYear(), d.getDate(), d.getMonth())

    let items = [];


    const pdfParser = new PDFParser();
    let promise = new Promise((resolve, reject) => {
        pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
        pdfParser.on("pdfParser_dataReady", pdfData => {
            pdfData.Pages.forEach((p, i) => {

                p.Texts.forEach((t, ti) => {
                    t["P"] = i; items.push(t); t["text"] = decodeURIComponent(t.R[0].T)
                    t["pw"] = p.Width
                });

                // console.log(p)
            });
            resolve(items);
            // console.log(JSON.stringify(pdfParser.getAllFieldsTypes()))
        });
        // pdfParser.on("data",  data => this.emit("data", data));
        // data => this.emit("data", data));
        // pdfParser.loadPDF("./pdf/20221222_20221222___thong_ke_giao_dich_tu_doanh.pdf");
        //20221114_20221114___thong_ke_giao_dich_tu_doanh.pdf
        pdfParser.loadPDF("./20221114_20221114___thong_ke_giao_dich_tu_doanh.pdf");
    });

    items = await promise;
    items.sort((a, b) => {
        return a.P > b.P ? 1 : a.P < b.P ? -1 : (a.y > b.y ? 1 : a.y < b.y ? -1 : (a.x > b.x ? 1 : a.x < b.x ? -1 : 0));
    });


    let z = 0;

    const SGD = "SỞ GIAO DỊCH CHỨNG KHOÁN TP. HỒ CHÍ MINH";
    let M1, B1, M2, B2, M3, B3, M4, B4, MA, END, E5, STT;
    let next = M1;
    let idx = 0;
    for (let i of items) {
        // console.log(i.text, i.P)
        if (i.text == "Mua" || i.text == "Bán") {
            switch (idx) {
                case 0:
                    M1 = i;
                    break;
                case 1:
                    B1 = i;
                    break;
                case 2:
                    M2 = i;
                    break;
                case 3:
                    B2 = i;
                    break;
                case 4:
                    M3 = i;
                    break;
                case 5:
                    B3 = i;
                    break;
                case 6:
                    M4 = i;
                    break;
                case 7:
                    B4 = i;
                    break;
            }
            idx++;
        }

        if (i.text == "Mã CK") {
            MA = i;
        }
        if (i.text == "Stt") {
            STT = i;
        }
        if (i.text == SGD && idx > 0) {
            END = i;
            break;
        }
    }


    E5 = Object.assign({}, B4);
    E5.x = B4.x + B4.w / B4.pw + B4.sw;

    var l = items.filter((e, i) => {
        return e.P < END.P;
    })

    // console.log(M1, B1)
    // console.log(M2, B2)
    // console.log(M3, B3)
    // console.log(M4, B4)
    // console.log(END)

    // let sum = {

    //     TT: { KL: [], TT: [] }
    // }

    let tc;
    let symbol;
    let record = [, , , , , , , , ,];
    let begin = false;

    let decode = (record, idx, val, e1, e2) => {
        if (val.x >= (e1.x + e1.w / e1.pw) && (val.x + val.w / val.pw) < e2.x) {
            // console.log(val.text);       
            record[idx] = val.text;
        }
    }
    let decode2 = (record, idx, val, e1, e2) => {
        if (val.x >= (e1.x + e1.w / e1.pw) && (val.x + val.w / val.pw) < e2.x) {
            record[idx] = val.text;
        }
    }

    let sum = [];
    l.forEach((val, idx) => {
        if (val.y <= M1.y && val.P <= M1.P) {
            return;
        }

        // if(val.text == "7,149,500"){
        //    console.log(val.x, M1.x , (val.x + val.w / val.pw) , B1.x) 
        //    console.log(val,M1, B1) 
        // }

        if (val.x >= MA.x && (val.x + val.w / val.pw) < M1.x) {
            // console.log(val.text);
            begin = true;
            symbol = val.text;
            sum.push(record);
            record = [, , , , , , , , ,];
        }
        decode(record, 0, val, STT, M1); //Sy
        decode2(record, 1, val, MA, B1); //M1
        decode2(record, 2, val, M1, M2); //B1
        decode2(record, 3, val, B1, B2); //M2
        decode2(record, 4, val, M2, M3); //B2
        decode2(record, 5, val, B2, B3); //M3
        decode2(record, 6, val, M3, M4); //B3
        decode2(record, 7, val, M4, B4); //B4
        decode2(record, 8, val, B4, E5);

        // decode(record, 0, val, MA1, M1); //Sy
        // decode2(record, 1, val, MA, B1); //M1
        // decode2(record, 2, val, M1, M2); //B1
        // decode2(record, 3, val, B1, B2); //M2
        // decode2(record, 4, val, M2, M3); //B2
        // decode2(record, 5, val, B2, B3); //M3
        // decode2(record, 6, val, M3, M4); //B3
        // decode2(record, 7, val, M4, B4); //B4
        // decode2(record, 8, val, B4, E5);        
    });

    sum.push(record) //last

    for (let e of sum) {
        // console.log(e);
    }

    // let zz = sum.filter((e)=>{return e[1] != undefined}).map(e=>+(e[1].replace(/,/g, '')));
    let head = sum[0];


    console.log(head);

    head.forEach((v, i) => {
        if (v == undefined) {
            return;
        }
        let zz = sum.filter((e) => { return e[i] != undefined }).map(e => +(e[i].replace(/,/g, '')));
        let v1 = zz.slice(1);
        let v2 = v1.reduce((a, b) => a + b, 0)
        if (v2 != +(v.replace(/,/g, ''))) {
            // console.log("Co sai du lieu ", i, v,v2)
            // console.log(zz);
        } else {
            // console.log("Ok  ", i, v,v2)
        }
    })



    //  console.log(v2,zz[0]);    
    const pdfData = fs.readFileSync("./pdf/20221222_20221222___thong_ke_giao_dich_tu_doanh.pdf");

    const loadingTask = pdf.getDocument("./20221114_20221114___thong_ke_giao_dich_tu_doanh.pdf");

    // loadingTask.promise
    //     .then(function (doc) {
    //         const numPages = doc.numPages;
    //         console.log("# Document Loaded");
    //         console.log("Number of Pages: " + numPages);
    //         console.log();

    //         let lastPromise; // will be used to chain promises
    //         lastPromise = doc.getMetadata().then(function (data) {
    //             console.log("# Metadata Is Loaded");
    //             console.log("## Info");
    //             console.log(JSON.stringify(data.info, null, 2));
    //             console.log();
    //             if (data.metadata) {
    //                 console.log("## Metadata");
    //                 console.log(JSON.stringify(data.metadata.getAll(), null, 2));
    //                 console.log();
    //             }
    //         });

    //         const loadPage = function (pageNum) {
    //             return doc.getPage(pageNum).then(function (page) {
    //                 console.log("# Page " + pageNum);
    //                 const viewport = page.getViewport({ scale: 1.0 });
    //                 console.log("Size: " + viewport.width + "x" + viewport.height);
    //                 console.log();
    //                 return page
    //                     .getTextContent()
    //                     .then(function (content) {
    //                         // Content contains lots of information about the text layout and
    //                         // styles, but we need only strings at the moment
    //                         content.items.sort((a,b)=>{
    //                             return a.transform[5] > b.transform[5] ? -1:  a.transform[5] < b.transform[5] ? 1: (a.transform[4] > b.transform[4] ? 1:  a.transform[4] < b.transform[4] ?-1:0 )
    //                         })
    //                         const strings = content.items.map(function (item) {
    //                             return item.str;
    //                         });
    //                         console.log("## Text Content");
    //                         console.log(strings.join("|"));
    //                         // Release page resources.


    //                         // console.log(content.items)
    //                         page.cleanup();
    //                     })
    //                     .then(function () {
    //                         console.log();
    //                     });
    //             });
    //         };


    //         // Loading of the first page will wait on metadata and subsequent loadings
    //         // will wait on the previous pages.
    //         for (let i = 1; i <= numPages; i++) {
    //             lastPromise = lastPromise.then(loadPage.bind(null, i));
    //         }
    //         return lastPromise;
    //     })
    //     .then(
    //         function () {
    //             console.log("# End of Document");
    //         },
    //         function (err) {
    //             console.error("Error: " + err);
    //         }
    //     );



    const doc = await loadingTask.promise;

    // console.log(doc.getPage(1).then(p=>{console.log(p)}))
    let i = 0;

    // (await doc.getPage(1)).getAnnotations().then(function (ops) {
    //     // console.log(i++,ops,ops)
    //     // for(let e of ops.items){
    //     //     console.log(i++,e)
    //     // }

    //     // for (var i=0; i < ops.fnArray.length; i++) {
    //     //     // if (ops.fnArray[i] == pdf.OPS.paintJpegXObject) {
    //     //         // window.objs.push(ops.argsArray[i][0])
    //     //         console.log(ops.argsArray[i])
    //     //     // }
    //     // }
    // })


    // doc.getData().then((e)=>{
    //     console.log(e);
    // })


    // (await doc.getPage(1)).getTextContent().then( function(ops){console.log(ops)});

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

    let text = await (await doc.getPage(1)).getTextContent();
    let anno = await (await doc.getPage(1)).getAnnotations();


    // for (let a of anno) {
    //     console.log(a.contentsObj, a.rect);
    // }

 
    for(let t of text.items){
        console.log(t);
    }

})();