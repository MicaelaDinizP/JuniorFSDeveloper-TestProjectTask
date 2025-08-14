const scrapeBtn = document.getElementById('scrapeBtn');
const resultsDiv = document.getElementById('results');

scrapeBtn.addEventListener('click', async () => {
  const keyword = document.getElementById('keyword').value.trim();
  if (!keyword) return alert('Please enter a keyword.');

  resultsDiv.innerHTML = '<p class="loading">Loading...</p>';

  try {
    const res = await fetch(`http://localhost:8080/api/scrape?keyword=${encodeURIComponent(keyword)}`);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      resultsDiv.innerHTML = '<p class="no-results">No results found.</p>';
      return;
    }

    resultsDiv.innerHTML = data.results.map(product => `
      <div class="product-card">
        <img src="${product.image}" alt="${product.title}" />
        <div class="product-info">
          <h2>${product.title}</h2>
          <p>Rating: ${product.rating || '0'} / 5</p>
          <p>Reviews: ${product.reviews || 0}</p>
        </div>
      </div>
    `).join('');
  } catch (err) {
    resultsDiv.innerHTML = '<p class="error">Error fetching results.</p>';
    console.error(err);
  }
});
