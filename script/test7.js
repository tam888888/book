
import { Exchange } from './Exchange.js';
import trendyways from "trendyways";

  // Exchange.GStock.stocks()


  let today = new Date();

// Trừ 5 ngày
let fiveDaysAgo = new Date(today);
fiveDaysAgo.setDate(today.getDate() - 17);

console.log("Ngày hiện tại: ", today);
console.log("Trừ 5 ngày: ", fiveDaysAgo);

let p = [1.2,1.1,1.4,0.9,0.8,1.5]
let z = trendyways.max(p)

console.log(z)


let a = await fetch("https://mt.vietcap.com.vn/api/market-watch/LEData/getAll", {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    "sec-ch-ua": "\"Not/A)Brand\";v=\"99\", \"Microsoft Edge\";v=\"115\", \"Chromium\";v=\"115\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "Referer": "https://trading.vietcap.com.vn/",
    "Referrer-Policy": "no-referrer-when-downgrade"
  },
  "body": "{\"symbol\":\"VCI\",\"limit\":10,\"truncTime\":null}",
  "method": "POST"
});



let zz = await a.json()

console.log(zz)

a = Exchange.VCI.getAll('VCI')

console.table(a)
// Hàm để kiểm tra hướng của 3 điểm: 1: ngược chiều kim đồng hồ, -1: theo chiều kim đồng hồ, 0: thẳng hàng
function orientation(p1, p2, p3) {
    const val = (p2.y - p1.y) * (p3.x - p2.x) - (p2.x - p1.x) * (p3.y - p2.y);
    if (val === 0) return 0; // Thẳng hàng
    return val > 0 ? 1 : -1; // Ngược chiều kim đồng hồ hoặc theo chiều kim đồng hồ
}

// Hàm để thực hiện thuật toán Jarvis March
function convexHull(points) {
    const n = points.length;
    if (n < 3) return []; // Cần ít nhất 3 điểm để tạo thành đa giác lồi

    // Tìm điểm nằm trên cùng của đa giác lồi (điểm bắt đầu)
    let start = 0;
    for (let i = 1; i < n; i++) {
        if (points[i].x < points[start].x) {
            start = i;
        }
    }

    const convexPoints = [];
    let current = start;

    do {
        convexPoints.push(points[current]);
        let next = (current + 1) % n;

        for (let i = 0; i < n; i++) {
            if (orientation(points[current], points[i], points[next]) === -1) {
                next = i;
            }
        }

        current = next;
    } while (current !== start);

    return convexPoints;
}

// Ví dụ sử dụng
const points = [
    { x: 1, y: 1 },
    { x: 2, y: 3 },
    { x: 3, y: 5 },
    { x: 1, y: 7 },
    { x: 5, y: 2 },
    { x: 7, y: 4 },
    { x: 4, y: 6 },
];

const convexHullPoints = convexHull(points);
console.log("Điểm trên đường phía trên:");
console.log(convexHullPoints);