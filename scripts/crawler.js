'use strict'

const fs = require('fs')
const path = require('path')

const axios = require('axios')
const puppeteer = require('puppeteer')

const api = axios.create({
  baseURL: 'https://api.etherscan.io'
})
;(async () => {
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()

    for (let i = 1; i <= 11; i++) {
      const url = 'https://etherscan.io' + `/tokens?p=${i}`
      await page.goto(url)
      const tokenSelector =
        '#ContentPlaceHolder1_divresult > table > tbody > tr > td:nth-child(3) > h5 > a'
      const addrs = await page.evaluate(tokenSelector => {
        const anchors = Array.from(document.querySelectorAll(tokenSelector))
        return anchors.map(anchor => {
          const fields = anchor.href.split('/')
          return fields[fields.length - 1]
        })
      }, tokenSelector)
      for (let address of addrs) {
        console.log(address)
        const response = await api.get(
          `/api?module=contract&action=getsourcecode&address=${address}`
        )
        const dataPath = path.resolve(__dirname, 'data', address)
        await fs.writeFile(
          dataPath,
          JSON.stringify(response.data),
          'utf-8',
          err => {
            if (err) {
              console.error(err)
            }
          }
        )
      }
    }

    await browser.close()
  } catch (err) {
    console.error(err)
  }
})()
