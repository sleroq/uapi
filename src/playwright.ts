import { chromium } from 'playwright-extra';
import { Browser, Page } from "playwright-core";
import Werror from './lib/werror.js';

import stealthPlugin from 'puppeteer-extra-plugin-stealth';
chromium.use(stealthPlugin());

export default class UApi {
    private page: Page | undefined;
    private browser: Browser | undefined;

    async start () {
        this.browser = await chromium.launch({ headless: true });
        this.page = await this.browser.newPage();

        await this.page.goto('https://you.com/search?q=who+are+you&tbm=youchat&cfr=chat');
        await this.page.waitForTimeout(2000);
    }

    async ask(question: string): Promise<string> {
        const page = this.page;
        if (!page) {
            throw new Error('Browser is not started');
        }
        const url = makeUrl(question);

        await page.goto(url.toString());
        await page.waitForSelector('body');

        const text = await page.innerText('body pre');

        let resArray = text.split("\n\n");
        resArray.shift();

        let message = '';

        resArray.forEach((el) => {
            let elArray = el.split("\n");

            if (!elArray[0] || !elArray[1]) {
                console.log('Warn: Can\'t find data');
                return;
            }

            try {
                const event = elArray[0].replace('event: ', '');
                const data = elArray[1].replace('data: ', '');

                if (event == 'youChatToken') {
                    let dataObject = JSON.parse(data);
                    message += dataObject.youChatToken;
                }
            } catch (error) {
                console.log(text);
                throw new Werror(error, 'Parsing AI response');
            }
        });

        if (!message) {
            return 'Idk what to say';
        }

        return message.trim();
    }

    async shutdown() {
        if (!this.browser) {
            throw new Error('Browser is not started');
        }
        await this.browser.close();
    }
}

function makeUrl(query: string): string {
    const url = new URL('https://you.com/api/streamingSearch');
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('safeSearch', 'Off');
    params.set('onShoppingPage', 'false');
    params.set('page', '1');
    params.set('count', '10');
    params.set('mkt', '');
    params.set('domain', 'youchat');
    params.set('responseFilter', 'TimeZone');
    // params.set('queryTraceId', '');
    // params.set('chat', '[]');
    // params.set('chatId', '');

    url.search = params.toString();
    return url.toString();
}
