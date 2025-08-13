import fs from "fs";
import express from 'express';
import axios from 'axios';
import { JSDOM } from 'jsdom';

const app = express();
const PORT = 8080;

app.get('/api/scrape', async (req, res) => {
  const keyword = req.query.keyword;

  //keyword parameter validation
  if (!keyword || keyword.trim() === '') {
    return res.status(400).json({ error: 'Keyword is required and cannot be empty' });
  }

  try {

    //Search amazon page html
    const html = await fetchAmazonPage(keyword);
    
    //Processing html with JSDOM
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    //Select product elements
    const products = [];
    const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');

    productElements.forEach((product) =>{
      const title = product.querySelector('h2.a-size-base-plus span')?.textContent.trim() || null;
      const ratingText = product.querySelector('i.a-icon-alt span, .a-icon-alt')?.textContent?.trim() || "0";
      const rating = parseFloat(ratingText.replace(',', '.').match(/[\d\.]+/)?.[0] || 0);
      const reviewsText = product.querySelector('a.s-underline-text, a.s-underline-link-text')?.textContent.trim() || "0";
      const reviews = isNaN(parseInt(reviewsText.replace(/\D/g, ''))) ? 0 : parseInt(reviewsText.replace(/\D/g, ''));
      const image = product.querySelector('img.s-image')?.src || null;

      products.push({
        title,
        rating,
        reviews,
        image,
      });
    });
    
  
    res.json({
      message: `You searched the keyword: ${keyword}`,
      results: products
    });
    //console.log(dom.window.document.querySelectorAll(".s-result-item").length);
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
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0', //The user agent had to be more specific so the Amazon page would authorize the request
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
