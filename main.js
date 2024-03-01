const { processImages } = require("./ioHandler")

const zipFilePath = "C:/Users/chris/OneDrive - BCIT/Term2/ACIT2520/week7/myfile.zip"

processImages(zipFilePath)
    .then(() => {
        console.log("Extraction operation complete")
    })
    .catch((error) => {
        console.error("An error occurred:", error)
    })