const https = require('https');
const fs = require('fs');

const url = "https://codeload.github.com/DavidHDev/react-bits/zip/refs/heads/main";
const file = fs.createWriteStream("react-bits.zip");

https.get(url, (response) => {
  response.pipe(file);
  file.on("finish", () => {
    file.close();
    console.log("Download completed");
  });
}).on("error", (err) => {
  fs.unlink("react-bits.zip");
  console.error("Error: " + err.message);
});
