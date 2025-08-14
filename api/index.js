import express from "express";
import axios from "axios";
import cors from "cors";
import { JSDOM } from "jsdom";
import sanitizeHtml from "sanitize-html";

const PORT = 8080;
const AMAZON_BASE_URL = "https://www.amazon.com.br/s?k=";
const REQUEST_TIMEOUT = 5000;
const MAX_KEYWORD_LENGTH = 100;

const app = express();
app.use(cors());

app.get("/api/scrape", async (req, res) => {
  const keyword = sanitizeText(req.query.keyword || "");
  const error = validateKeyword(keyword);
  if (error) return res.status(400).json({ error });

  try {
    const html = await fetchAmazonPage(keyword);
    const products = parseAmazonHTML(html);

    res.json({
      message: `You searched for: ${keyword}`,
      results: products,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch Amazon page" });
  }
});

async function fetchAmazonPage(keyword) {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `${AMAZON_BASE_URL}${encodedKeyword}`;

  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    },
    timeout: REQUEST_TIMEOUT,
  });

  return response.data;
}

function parseAmazonHTML(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const products = [];

  document.querySelectorAll('[data-component-type="s-search-result"]').forEach((element) => {
    const title = sanitizeText(element.querySelector("h2.a-size-base-plus span")?.textContent || "");
    const rating = extractRating(element);
    const reviews = extractReviews(element);
    const image = element.querySelector("img.s-image")?.src || null;

    products.push({ title, rating, reviews, image });
  });

  return products;
}

function extractRating(element) {
  const ratingElement =
    element.querySelector(".a-icon-alt") ||
    element.querySelector("i.a-icon-star-small") ||
    element.querySelector("i.a-icon-star");

  const ratingText =
    ratingElement?.textContent?.trim() ||
    ratingElement?.getAttribute("aria-label") ||
    "0";

  return parseFloat(ratingText.replace(",", ".").match(/[\d\.]+/)?.[0] || 0);
}

function extractReviews(element) {
  const reviewsElement =
    element.querySelector('[data-cy="reviews-block"] a:nth-of-type(2) span[aria-hidden="true"]') ||
    element.querySelector('[data-cy="reviews-block"] span.a-size-base.s-underline-text') ||
    element.querySelector("a.s-underline-text, a.s-underline-link-text, span.s-link-style");

  const reviewsText = reviewsElement?.textContent.trim() || "0";
  return parseInt(reviewsText.replace(/\D/g, ""), 10) || 0;
}

function validateKeyword(keyword) {
  if (!keyword || keyword.trim() === "") return "Keyword is required";
  if (keyword.length > MAX_KEYWORD_LENGTH) return "Keyword is too long";
  if (!/^[\p{L}\p{N}\s\-\.]+$/u.test(keyword)) return "Keyword contains invalid characters";
  return null;
}

function sanitizeText(text) {
  return sanitizeHtml(text || "", { allowedTags: [], allowedAttributes: {} }).trim();
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
