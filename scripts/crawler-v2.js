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
        const infoSelector =
          '#ContentPlaceHolder1_tr_tokeninfo > td:nth-child(2) > a'
        await page.waitForSelector(infoSelector)
        const tokenInfo = await page.evaluate(infoSelector => {
          return document
            .querySelector(infoSelector)
            .textContent.replace(/^\s+|\s+$/g, '')
        }, infoSelector)
        console.log(tokenInfo)
        const sourceSelector = '#editor'
        await page.waitForSelector(sourceSelector, { timeout: 10000 })
        const sourceCode = await page.evaluate(
          'var editor = ace.edit("editor"); editor.getValue();'
        )

        const solPath = path.resolve(__dirname, 'sol', tokenInfo + '.sol')
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
