import express from 'express';
import axios from 'axios';

const app = express();
const PORT = 8080;

app.get('/api/scrape', async (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword || keyword.trim() === '') {
    return res.status(400).json({ error: 'Keyword is required and cannot be empty' });
  }

  try {
    const html = await fetchAmazonPage(keyword);
     res.json({ message: `You searched the keyword: ${keyword}`});
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

  return response.data;
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
