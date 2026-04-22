import axios from 'axios';
import fs from 'fs';

async function download(url, dest) {
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream'
  });
  
  response.data.pipe(fs.createWriteStream(dest));
  
  return new Promise((resolve, reject) => {
    response.data.on('end', () => resolve());
    response.data.on('error', reject);
  });
}

async function run() {
  console.log("Downloading mascot...");
  await download('https://url.dinzid.my.id/2A4kIZ', './public/mascot.png');
  console.log("Downloading logo...");
  await download('https://url.dinzid.my.id/zjsWjP', './public/logo.png');
  console.log("Done");
}
run();
