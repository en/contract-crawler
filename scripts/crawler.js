'use strict'

const fs = require('fs')
const path = require('path')

const axios = require('axios')
const puppeteer = require('puppeteer')

fs.writeFilePromise = function(path, data) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(path, data, 'utf-8', function(err) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

const api = axios.create({
  baseURL: 'https://api.etherscan.io'
})
;(async () => {
  try {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    for (let i = 1; i <= 11; i++) {
      const url = 'https://etherscan.io' + `/tokens?p=${i}`
      await page.goto(url)
      const tokenSelector =
        '#ContentPlaceHolder1_divresult > table > tbody > tr > td:nth-child(3) > h5 > a'
      const links = await page.evaluate(tokenSelector => {
        const anchors = Array.from(document.querySelectorAll(tokenSelector))
        return anchors.map(anchor => anchor.href)
      }, tokenSelector)
      for (let link of links) {
        await page.goto(link)
        const address = await page.evaluate(() => {
          const addressSelector =
            '#ContentPlaceHolder1_trContract > td.tditem > a'
          return document.querySelector(addressSelector).textContent
        })
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
