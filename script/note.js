fetch("https://finfo-api.vndirect.com.vn/v4/stocks?q=type:stock,ifc~floor:HOSE,HNX,UPCOM&size=9999", {
  "headers": {
    "content-type": "application/json",
    "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
    "sec-ch-ua-mobile": "?0"
  },
  "referrer": "https://dstock.vndirect.com.vn/",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors"
});


let a=await fetch("https://finfo-api.vndirect.com.vn/v4/industry_classification?q=industryLevel:4", {
  "headers": {
    "content-type": "application/json",
    "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
    "sec-ch-ua-mobile": "?0"
  },
  "referrer": "https://dstock.vndirect.com.vn/",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors"
});

let z= await a.json()
z
let all=[]
all.length=0;
z.data.forEach(e=>{ e.codeList.split(",").forEach(v=>{all.push(v)})})
console.log(all.length)
