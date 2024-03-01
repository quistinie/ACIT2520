const yauzl = require("yauzl")
const fs = require("fs")
const path = require("path")
const PNG = require("pngjs").PNG

function unzip(zipFilePath, destinationDir) {
    return new Promise((resolve, reject) => {
        yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
            if (err) {
                reject(err)
                return
            }
            zipfile.readEntry()
            zipfile.on("entry", (entry) => {
                if (/\/$/.test(entry.fileName)) {
                    // Directory entry
                    zipfile.readEntry()
                } else {
                    // File entry
                    zipfile.openReadStream(entry, (err, readStream) => {
                        if (err) {
                            reject(err)
                            return
                        }
                        const entryPath = path.join(destinationDir, path.basename(entry.fileName))
                        fs.mkdir(destinationDir, { recursive: true }, (err) => {
                            if (err) {
                                reject(err)
                                return
                            }
                            readStream.pipe(fs.createWriteStream(entryPath))
                            readStream.on("end", () => {
                                zipfile.readEntry()
                            })
                        })
                    })
                }
            })
            zipfile.on("end", () => {
                resolve(destinationDir)
            })
        })
    })
}

function readDir(directoryPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                reject(err)
            } else {
                const pngFiles = files.filter(file => path.extname(file).toLowerCase() === ".png")
                resolve(pngFiles.map(file => path.join(directoryPath, file)))
            }
        })
    })
}

function grayScale(pathIn, pathOut) {
    return new Promise((resolve, reject) => {
        fs.mkdir(path.dirname(pathOut), { recursive: true }, (err) => {
            if (err) {
                reject(err)
                return
            }
            fs.createReadStream(pathIn)
                .pipe(new PNG())
                .on("parsed", function () {
                    for (let y = 0; y < this.height; y++) {
                        for (let x = 0; x < this.width; x++) {
                            const idx = (this.width * y + x) << 2
                            const avg = (this.data[idx] + this.data[idx + 1] + this.data[idx + 2]) / 3
                            this.data[idx] = avg
                            this.data[idx + 1] = avg
                            this.data[idx + 2] = avg
                        }
                    }
                    this.pack().pipe(fs.createWriteStream(pathOut))
                        .on("finish", resolve)
                        .on("error", reject)
                })
                .on("error", reject)
        })
    })
}


async function processImages(zipFilePath) {
    try {
        const unzipDir = await unzip(zipFilePath, "C:/Users/chris/OneDrive - BCIT/Term2/ACIT2520/week7/unzipped")
        const pngFiles = await readDir(unzipDir)
        const promises = pngFiles.map((file) => {
            const outputPath = path.join("C:/Users/chris/OneDrive - BCIT/Term2/ACIT2520/week7/filtered", path.basename(file))
            return grayScale(file, outputPath)
        })
        await Promise.all(promises)
    } catch (error) {
        throw error
    }
}


module.exports = { processImages, unzip, readDir, grayScale }
