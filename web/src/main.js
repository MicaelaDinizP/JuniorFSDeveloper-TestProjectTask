const scrapeBtn = document.getElementById('scrapeBtn');
const resultsDiv = document.getElementById('results');

scrapeBtn.addEventListener('click', async () => {
  const keyword = document.getElementById('keyword').value.trim();
  if (!keyword) return alert('Please enter a keyword.');

  resultsDiv.innerHTML = 'Loading...';

  try {
    const res = await fetch(`http://localhost:8080/api/scrape?keyword=${encodeURIComponent(keyword)}`);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      resultsDiv.innerHTML = 'No results found.';
      return;
    }

    resultsDiv.innerHTML = data.results.map(product => `
      <div class="product">
        <img src="${product.image}" alt="${product.title}" />
        <h3>${product.title}</h3>
        <p>Rating: ${product.rating || '0'} / 5</p>
        <p>Reviews: ${product.reviews || 0}</p>
      </div>
    `).join('');
  } catch (err) {
    resultsDiv.innerHTML = 'Error fetching results.';
    console.error(err);
  }
});