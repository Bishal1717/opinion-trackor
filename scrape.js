import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

// Define your credentials and Telegram bot details
const USERNAME = process.env.OPINION_WORLD_USERNAME;
const PASSWORD = process.env.OPINION_WORLD_PASSWORD;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function scrape() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Set User-Agent to appear as a regular browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    await page.goto('https://www.opinionworld.in/');
    console.log('Navigated to Opinion World');

    // Log in
    await page.click('a[href="/login"]');
    console.log('Clicked login link');

    await page.waitForSelector('input[name="email"]');
    console.log('Email input field found');

    await page.type('input[name="email"]', USERNAME);
    console.log('Typed email');

    await page.type('input[name="password"]', PASSWORD);
    console.log('Typed password');

    await page.click('button[class="auth-button-submit btn btn-primary"]');
    console.log('Clicked submit button');

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('Landed on Dashboard Page');

    // Accept cookies popup
    try {
        await page.waitForSelector('button[aria-label="banner close button"]', { timeout: 5000 }); // Adjust selector and timeout as needed
        await page.click('button[aria-label="banner close button"]');
        console.log('Accepted cookies');
    } catch (error) {
        console.log('Cookies popup not found or already accepted');
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'available_surveys.png' });

    // Check for surveys
    const surveyAvailable = await page.evaluate(() => {
        return document.querySelector('.list-group-item') !== null; // Ensure this selector is correct
    });

    if (surveyAvailable) {
        try {
            const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: TELEGRAM_CHAT_ID,
                text: 'A new survey is available on Opinion World for ' + USERNAME
            });
            console.log('Telegram message sent:', response.data);
        } catch (error) {
            console.error('Error sending Telegram message:', error.response ? error.response.data : error.message);
        }
    }

    await browser.close();
}

scrape().catch(error => {
    console.error('Error scraping:', error);
});
