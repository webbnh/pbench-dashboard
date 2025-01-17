import puppeteer from 'puppeteer';
import { mockIndices, mockMappings, mockSearch } from '../../mock/api';

let browser;
let page;
jest.setTimeout(30000);

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  page = await browser.newPage();
  await page.goto('http://localhost:8000/dashboard/');

  await page.click('#nav-toggle > svg');
  await page.click('#page-sidebar > div > nav > ul > li:nth-child(3) > a');
  await page.click('#nav-toggle > svg');

  // Intercept network requests
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.method() === 'POST' && request.postData().includes('query_string')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(mockSearch),
      });
    } else if (request.method() === 'GET' && request.url().includes('/controllers/months')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(mockIndices),
      });
    } else if (request.method() === 'POST' && request.postData().includes('mappings')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(mockMappings),
      });
    } else {
      request.continue();
    }
  });
});

afterAll(() => {
  browser.close();
});

describe('search page component', () => {
  test('should load mappings', async () => {
    await page.waitForSelector(
      '#root > div > main > section.pf-c-page__main-section.pf-m-light > div > form > div.pf-l-flex > div:nth-child(2) > p'
    );
    const testField = await page.$eval(
      '#root > div > main > section.pf-c-page__main-section.pf-m-light > div > form > div.pf-l-flex > div:nth-child(2) > p',
      elem => elem.innerHTML
    );
    expect(testField).toBe('run');
  });

  test('should select field tag', async () => {
    await page.waitForSelector(
      '#root > div > main > section.pf-c-page__main-section.pf-m-light > div > form > div.pf-l-flex > div:nth-child(2) > div'
    );
    await page.click(
      '#root > div > main > section.pf-c-page__main-section.pf-m-light > div > form > div.pf-l-flex > div:nth-child(2) > div'
    );

    await page.waitForSelector(
      '#root > div > main > section.pf-c-page__main-section.pf-m-light > div > form > div.pf-l-flex > div:nth-child(2) > div > div > div > input'
    );
    await page.click(
      '#root > div > main > section.pf-c-page__main-section.pf-m-light > div > form > div.pf-l-flex > div:nth-child(2) > div > div > div > input'
    );
  });

  test('should apply filter changes', async () => {
    await page.waitForSelector(
      '#root > div > main > section.pf-c-page__main-section.pf-m-light > div > form > div:nth-child(2) > button:nth-child(1)'
    );
    await page.click(
      '#root > div > main > section.pf-c-page__main-section.pf-m-light > div > form > div:nth-child(2) > button:nth-child(1)'
    );
  });

  test('should reset filter changes', async () => {
    await page.waitForSelector(
      '#root > div > main > section.pf-c-page__main-section.pf-m-light > div > form > div:nth-child(2) > button:nth-child(2)'
    );
    await page.click(
      '#root > div > main > section.pf-c-page__main-section.pf-m-light > div > form > div:nth-child(2) > button:nth-child(2)'
    );
  });

  test('should input search query', async () => {
    await page.waitForSelector(
      '#root > div > main > section.pf-c-page__main-section.pf-m-light > div > div.pf-c-input-group > input'
    );
    await page.type(
      '#root > div > main > section.pf-c-page__main-section.pf-m-light > div > div.pf-c-input-group > input',
      'test'
    );
  });

  test('should execute search query', async () => {
    await page.waitForSelector(
      '#root > div > main > section.pf-c-page__main-section.pf-m-light > div > div.pf-c-input-group > button > svg'
    );
    await page.click(
      '#root > div > main > section.pf-c-page__main-section.pf-m-light > div > div.pf-c-input-group > button'
    );
    expect(mockSearch.hits.hits.length).toBe(100);
  });
});
