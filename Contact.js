import '@babel/polyfill'
require('dotenv').config()

const puppeteer = require('puppeteer')
const fs = require('fs')
const aws = require('aws-sdk')
const path = require('path')

async function Contact() {
    try {
        const s3 = new aws.S3({
            accessKeyId: process.env.ACCESSKEYID,
            secretAccessKey: process.env.SECRETACCESSKEY,
            region: process.env.REGION
        })
        const browser = await puppeteer.launch({ headless: false })
        const page = await browser.newPage();
        await page.setViewport({
            width: 1200,
            height: 720
        })

        await page.goto('https://www.linkedin.com/login')

        await page.type('#username', process.env.USER)
        await page.type('#password', process.env.PASS)

        await page.click('.btn__primary--large')

        await page.goto('https://www.linkedin.com/mynetwork/invite-connect/connections/')

        const scrolling = await page.evaluate(() => {

            return new Promise((resolve, reject) => {
                let totalHeight = 0
                let distance = 500
                let timer = setInterval(() => {
                    let scrollHeight = document.body.scrollHeight
                    window.scrollBy(0, distance)
                    window.scrollBy(0, -100)

                    totalHeight = 22760

                    if (totalHeight <= scrollHeight) {
                        clearInterval(timer)
                        resolve(totalHeight)
                    }
                }, 400)
            })
        });
        console.log(scrolling)

        const dataContact = await page.evaluate(() =>
            [...document.querySelectorAll(".mn-connection-card")].map(e => {
                let ocupation = e.querySelector('.mn-connection-card__occupation').innerText
                let image = e.querySelector('img').getAttribute('src')
                let name = e.querySelector('.mn-connection-card__name').innerText
                return {
                    name,
                    ocupation,
                    image
                }
            })
        )
        console.log(dataContact);
        /*------------------------------------------------------------------------------------*/

        fs.writeFile('Contact.json', JSON.stringify(dataContact, ['name', 'ocupation', 'image'], 2), (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log('correcto')
            }
        });
        /*------------------------------------------------------------------------------------*/
        let saveTxtPlan = fs.createWriteStream(path.join(__dirname, './Contact.txt'));
        dataContact.forEach(dato => {
            saveTxtPlan.write(`
            name:${dato.name}\n
            ocupation:${dato.ocupation}\n
            image:${dato.image}
            `)
        })

        saveTxtPlan.close();
        /*------------------------------------------------------------------------------------*/
        const params = {
            Key: 'Contact.txt',
            Bucket: 'task-upload01',
            Body: JSON.stringify(dataContact, null, 2)
        }
        s3.putObject(params, (err, data) => {
            if (err) throw err
            console.log('Very good', data)
        })

        /*-----------------------------------------------------------------------------------*/
        await page.close();
        await browser.close();

        return dataContact

    } catch (error) {
        console.log(error);
    }
}
export default Contact;