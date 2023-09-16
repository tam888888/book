import imgToPDF from 'image-to-pdf'
import fs from "fs"
import PDFDocument from 'pdfkit'
import sharp from 'sharp'
async function convert() {
  console.log("Convert! Image")
  let dir = "./DanZanger"
  let outdir = "./DanZangerOut"
  let files = fs.readdirSync(dir);
  // files = files.map(e => dir + "/" + e)
  files.forEach(f => {
    sharp(dir + "/" + f)
      .grayscale()
      .toFormat('jpeg')
      .jpeg({
        quality: 20,
        //   chromaSubsampling: '4:4:4',
        density: 16,
        depth: 1,
        // progressive: false, force: true        
      })
      .toFile(outdir + "/" + f)
      .then(() => {
        console.log('Chuyển đổi thành công!');
      })
      .catch((error) => {
        console.error('Lỗi chuyển đổi:', error);
      });
  })


}


async function topdf() {

  let dir = "./DanZangerOut"
  let files = fs.readdirSync(dir);

  files.sort((a,b)=>{
    let a1= a.split("-")[8]
    let b1= b.split("-")[8]
    console.log(a1,b1)
    return a1-b1;

  });
  console.table(files)
  files = files.map(e => dir + "/" + e)

  const pages = [...files];
  // imgToPDF(pages,imgToPDF.sizes.A4).pipe(fs.createWriteStream('./DanZanger.pdf')) 
  // let doc = new PDFDocument()

  // "A4": [595.28, 841.89],
  // let f = './DanZanger/15.png'


  // Kích thước trang A4 (pixels)
  const pageSize = { width: 2048, height: 3119 };

  // Tạo một tài liệu PDF mới với kích thước trang A4
  const doc = new PDFDocument({ size: [pageSize.width, pageSize.height] });

  // Đọc kích thước của hình ảnh
  const imageWidth = 2048;
  const imageHeight = 3119;

  // Tính toán tỷ lệ giữa kích thước hình ảnh và kích thước trang A4
  const scale = Math.min(pageSize.width / imageWidth, pageSize.height / imageHeight);

  // Tính toán kích thước hình ảnh khi fit vào trang A4
  const fitWidth = imageWidth * scale;
  const fitHeight = imageHeight * scale;




  files.forEach(f => {


    // Tạo trang mới trong tài liệu PDF
    doc.addPage({ size: [pageSize.width, pageSize.height] });

    // Thêm hình ảnh đã fit vào trang PDF
    doc.image(f,0,0, {
      fit: [fitWidth, fitHeight],
      align: 'left',
      valign: 'top'
    });

    // doc.addPage()
    //   .image(f, {
    //     fit: [595.28, 841.89],
    //     align: 'center',
    //     valign: 'center'
    //   });

  })

  doc.pipe(fs.createWriteStream('./DanZanger.pdf'))
  doc.end()
}

convert();
// topdf();