const puppeteer = require('puppeteer');
const Sheet = require('./sheet');

(async function () {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    const sheet = new Sheet();
    await sheet.load();

    const urls = await sheet.getRows(0);
    for (let url of urls) {
        await page.goto(url.url);
        // create sheet with title
    const title = await page.$eval('.title a', el => el.textContent);
    const sheetIndex = await sheet.addSheet(title.slice(0, 99), ['points', 'text']);

    // expand all comment threads
    let expandButtons = await page.$$('.morecomments');
    while (expandButtons.length) {
        for (let button of expandButtons) {
            await button.click();
            await page.waitForTimeout(500);
        }
        await page.waitForTimeout(1000);
        expandButtons = await page.$$('.morecomments');
    }

    // select all comments, scrape text and points
    const comments = await page.$$('.entry');
    const formattedComments = [];
    for (let comment of comments) {
        // scrape points
        const points = await comment.$eval('.score', el => el.textContent).catch(err => console.error('no score'));
        // scrape text
        const rawText = await comment.$eval('.usertext-body', el => el.textContent).catch(err => console.error('no text'));
        if (points && rawText) {
            // remove \n line breaks with regEx
            const text = rawText.replace(/\n/g, '');
            formattedComments.push({ points, text });
        }
    }

    // sort comments by points

    formattedComments.sort((a, b) => {
        const pointsA = Number(a.points.split(' ')[0]);
        const pointsB = Number(b.points.split(' ')[0]);
        return pointsB - pointsA;
    })

    // insert into google spreadsheet
    sheet.addRows(formattedComments, sheetIndex);
    }

    

    await browser.close();
})()
