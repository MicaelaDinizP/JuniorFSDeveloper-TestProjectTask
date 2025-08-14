import fs from "fs";
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { JSDOM } from 'jsdom';

const app = express();
const PORT = 8080;

app.use(cors());

app.get('/api/scrape', async (req, res) => {
  const keyword = req.query.keyword;

  if (!keyword || keyword.trim() === '') {
    return res.status(400).json({ error: 'Keyword is required and cannot be empty' });
  }

  try {
    const html = await fetchAmazonPage(keyword);

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const products = [];
    const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');

    productElements.forEach(product => {
      const title = product.querySelector('h2.a-size-base-plus span')?.textContent.trim() || null;
      const ratingElement = product.querySelector('.a-icon-alt') || product.querySelector('i.a-icon-star-small') || product.querySelector('i.a-icon-star');
      const ratingText = ratingElement?.textContent?.trim() || ratingElement?.getAttribute('aria-label') || "0";
      const rating = parseFloat(ratingText.replace(',', '.').match(/[\d\.]+/)?.[0] || 0);
      let reviewsElement =
        product.querySelector(
          '[data-cy="reviews-block"] a:nth-of-type(2) span[aria-hidden="true"]'
        ) ||
        product.querySelector(
           '[data-cy="reviews-block"] span.a-size-base.s-underline-text'
        ) ||
        product.querySelector(
          'a.s-underline-text, a.s-underline-link-text, span.s-link-style'
        );

      const reviewsText = reviewsElement?.textContent.trim() || "0";
      const reviews = parseInt(reviewsText.replace(/\D/g, ""), 10) || 0;
      const image = product.querySelector('img.s-image')?.src || null;

      products.push({ title, rating, reviews, image });
    });

    res.json({ message: `You searched the keyword: ${keyword}`, results: products });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to fetch Amazon page' });
  }
});

async function fetchAmazonPage(keyword) {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://www.amazon.com.br/s?k=${encodedKeyword}`;

  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    }
  });

  fs.writeFileSync("amazon.html", response.data);

  return response.data;
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

