import DOMParser from "react-native-html-parser"
import fs from "fs"

let data = fs.readFileSync("data.txt","utf-8")

const parser  = new DOMParser.DOMParser();
let doc = parser.parseFromString(data)
// console.log()
let childNodes=doc.querySelect("body")[0]

console.log(childNodes.childNodes.length)


let childs = childNodes.childNodes;

// for(let i=0; i < childs.length; i++) {
//     // if(!childs[i].hasChildNodes()){
//     console.log(childs[i].textContent)
//     console.log("TAG",childs[i].tagName)
//     // }

//     console.log(childs[i].innerHTML)
// }



import { parse } from 'node-html-parser';

const root = parse(data);


// console.log(root.structuredText)

const nodesWithText = root.querySelectorAll('*').filter(node => node.textContent.trim().length > 0  );

// console.log(nodesWithText);
for(let e of nodesWithText){
    console.log(e.innerText)
}