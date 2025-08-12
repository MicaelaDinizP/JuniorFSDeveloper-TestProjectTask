import express from 'express';

const app = express();
const PORT = 8080;

app.get('/api/scrape', (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword || keyword.trim() === '') {
    return res.status(400).json({ error: 'Keyword is required and cannot be empty'});
  }
   res.json({ message: `You searched the keyword: ${keyword}`});
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 