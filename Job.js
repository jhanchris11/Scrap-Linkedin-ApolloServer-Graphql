import '@babel/polyfill'
require('dotenv').config()

const puppeteer = require('puppeteer')
const fs = require('fs')
const aws = require('aws-sdk')
const path = require('path')
async function Job() {

    try {

        const s3 = new aws.S3({
            accessKeyId: process.env.ACCESSKEYID,
            secretAccessKey: process.env.SECRETACCESSKEY,
            region: process.env.REGION
        })

        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.setViewport({
            width: 1200,
            height: 720
        })
        await page.goto('https://www.linkedin.com/login')

        await page.type('#username', process.env.USER)
        await page.type('#password', process.env.PASS)

        await page.click('.btn__primary--large')

        await page.goto(`https://www.linkedin.com/jobs/`)

        const scrolling2 = await page.evaluate(() => {
            return new Promise((resolve, reject) => {
                let totalHeight = 0
                let distance = 500
                let timer = setInterval(() => {
                    let scrollHeight = document.body.scrollHeight
                    window.scrollBy(0, distance)
                    window.scrollBy(0, -100)

                    totalHeight = 7656

                    if (totalHeight <= scrollHeight) {
                        clearInterval(timer)
                        resolve(totalHeight)
                    }
                }, 400)
            })
        });

        console.log(scrolling2);
        const dataJob = await page.evaluate(() =>
            [...document.querySelectorAll(".job-card")].map(e => {
                let position = e.querySelector('.job-card__title').innerText
                let logo = e.querySelector('.js-job-card-company-logo').getAttribute('src')
                let business = e.querySelector('.job-card__company-name').innerText
                let location = e.querySelector('.job-card__location').innerText
                return {
                    position,
                    logo,
                    business,
                    location
                }
            })
        )

        /*------------------------------------------------------------------------------------*/


        fs.writeFile('Job.json', JSON.stringify(dataJob, ['position', 'logo', 'business', 'location'], 2), (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log('correcto')
            }
        });

        /*------------------------------------------------------------------------------------*/
        let saveTxtPlan2 = fs.createWriteStream(path.join(__dirname, './Job.txt'));
        dataJob.forEach(dato2 => {
            saveTxtPlan2.write(`
            position:${dato2.position}\n
            logo:${dato2.logo}\n
            business:${dato2.business}\n
            location:${dato2.location}
            `)
        })

        saveTxtPlan2.close();
        /*------------------------------------------------------------------------------------*/
        const params = {
            Key: 'Job.txt',
            Bucket: 'task-upload01',
            Body: JSON.stringify(dataJob, null, 2)
        }
        s3.putObject(params, (err, data) => {
            if (err) throw err
            console.log('Very good', data)
        })

        /*------------------------------------------------------------------------------------*/


        await page.close();
        await browser.close();
        return dataJob;

    } catch (error) {
        console.log(error);
    }

}
export default Job;