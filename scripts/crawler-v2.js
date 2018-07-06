'use strict'

const fs = require('fs')
const path = require('path')

const puppeteer = require('puppeteer')
;(async () => {
  let browser, page
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    page = await browser.newPage()
  } catch (err) {
    console.error(err)
  }

  for (let i = 1; i <= 11; i++) {
    const url = 'https://etherscan.io' + `/tokens?p=${i}`
    let links = []
    try {
      await page.goto(url)
      const tokenSelector =
        '#ContentPlaceHolder1_divresult > table > tbody > tr > td:nth-child(3) > h5 > a'
      await page.waitForSelector(tokenSelector)
      links = await page.evaluate(tokenSelector => {
        const anchors = Array.from(document.querySelectorAll(tokenSelector))
        return anchors.map(
          anchor => anchor.href.replace(/token/, 'address') + '#code'
        )
      }, tokenSelector)
    } catch (err) {
      console.error(err)
    }
    for (let link of links) {
      try {
        await page.goto(link)
        const nameSelector =
          '#ContentPlaceHolder1_contractCodeDiv > div:nth-child(2) > table > tbody > tr:nth-child(1) > td:nth-child(2)'
        await page.waitForSelector(nameSelector)
        const contractName = await page.evaluate(nameSelector => {
          return document
            .querySelector(nameSelector)
            .textContent.replace(/^\s+|\s+$/g, '')
        }, nameSelector)
        console.log(contractName)
        const sourceSelector = '#editor'
        await page.waitForSelector(sourceSelector)
        const sourceCode = await page.evaluate(
          'var editor = ace.edit("editor"); editor.getValue();'
        )

        const solPath = path.resolve(__dirname, 'sol', contractName + '.sol')
        await fs.writeFile(solPath, sourceCode, 'utf-8', err => {
          if (err) {
            console.error(err)
          }
        })
      } catch (err) {
        console.error(err)
      }
    }
  }

  try {
    await browser.close()
  } catch (err) {
    console.error(err)
  }
})()
