
const express = require('express');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = 5000;

// In-memory storage for URLs (in production, you'd use a database)
const urlDatabase = new Map();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Generate short code
function generateShortCode() {
  return crypto.randomBytes(4).toString('hex').substring(0, 6);
}

// Validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Link Shortener</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 500px;
                width: 100%;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .title {
                font-size: 2.5rem;
                color: #333;
                margin-bottom: 10px;
                font-weight: 700;
            }
            
            .subtitle {
                color: #666;
                font-size: 1.1rem;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .input {
                width: 100%;
                padding: 15px;
                border: 2px solid #e1e5e9;
                border-radius: 12px;
                font-size: 1rem;
                transition: all 0.3s ease;
            }
            
            .input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            .btn {
                width: 100%;
                padding: 15px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                border-radius: 12px;
                color: white;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            
            .btn:hover {
                transform: translateY(-2px);
            }
            
            .btn:active {
                transform: translateY(0);
            }
            
            .result {
                margin-top: 20px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 12px;
                display: none;
            }
            
            .result.show {
                display: block;
            }
            
            .short-url {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 10px;
            }
            
            .short-url input {
                flex: 1;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                background: white;
            }
            
            .copy-btn {
                padding: 10px 15px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
            }
            
            .copy-btn:hover {
                background: #218838;
            }
            
            .stats {
                margin-top: 30px;
                text-align: center;
                color: #666;
            }
            
            @media (max-width: 480px) {
                .container {
                    padding: 20px;
                }
                
                .title {
                    font-size: 2rem;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="title">🔗 Link Shortener</h1>
                <p class="subtitle">Create short, shareable links instantly</p>
            </div>
            
            <form id="shortenForm">
                <div class="form-group">
                    <input 
                        type="url" 
                        id="originalUrl" 
                        class="input" 
                        placeholder="Enter your long URL here..." 
                        required
                    >
                </div>
                <button type="submit" class="btn">Shorten URL</button>
            </form>
            
            <div id="result" class="result">
                <h3>Your shortened URL:</h3>
                <div class="short-url">
                    <input type="text" id="shortUrlInput" readonly>
                    <button id="copyBtn" class="copy-btn">Copy</button>
                </div>
            </div>
            
            <div class="stats">
                <p>Total URLs shortened: <span id="totalUrls">${urlDatabase.size}</span></p>
            </div>
        </div>

        <script>
            const form = document.getElementById('shortenForm');
            const result = document.getElementById('result');
            const shortUrlInput = document.getElementById('shortUrlInput');
            const copyBtn = document.getElementById('copyBtn');
            const totalUrls = document.getElementById('totalUrls');

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const originalUrl = document.getElementById('originalUrl').value;
                
                try {
                    const response = await fetch('/shorten', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ url: originalUrl }),
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        // Format as markdown-style link
                        const displayUrl = originalUrl.replace(/^https?:\\/\\//, '').replace(/^www\\./, '');
                        const formattedOutput = '[' + displayUrl + '](' + data.shortUrl + ')';
                        shortUrlInput.value = formattedOutput;
                        result.classList.add('show');
                        totalUrls.textContent = data.totalUrls;
                    } else {
                        alert('Error: ' + data.error);
                    }
                } catch (error) {
                    alert('Error creating short URL. Please try again.');
                }
            });

            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(shortUrlInput.value);
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = 'Copy';
                    }, 2000);
                } catch (error) {
                    // Fallback for older browsers
                    shortUrlInput.select();
                    document.execCommand('copy');
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = 'Copy';
                    }, 2000);
                }
            });
        </script>
    </body>
    </html>
  `);
});

// API endpoint to create short URLs
app.post('/shorten', (req, res) => {
  const { url } = req.body;
  
  if (!url || !isValidUrl(url)) {
    return res.json({ success: false, error: 'Please provide a valid URL' });
  }
  
  // Check if URL already exists
  for (const [code, data] of urlDatabase.entries()) {
    if (data.originalUrl === url) {
      return res.json({ 
        success: true, 
        shortUrl: `${req.protocol}://${req.get('host')}/${code}`,
        totalUrls: urlDatabase.size
      });
    }
  }
  
  // Generate new short code
  let shortCode = generateShortCode();
  
  // Ensure uniqueness
  while (urlDatabase.has(shortCode)) {
    shortCode = generateShortCode();
  }
  
  // Store the URL
  urlDatabase.set(shortCode, {
    originalUrl: url,
    createdAt: new Date(),
    clicks: 0
  });
  
  const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
  
  res.json({ 
    success: true, 
    shortUrl,
    totalUrls: urlDatabase.size
  });
});

// Redirect endpoint
app.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  const urlData = urlDatabase.get(shortCode);
  
  if (!urlData) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Link Not Found</title>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 50px;
                  background: #f5f5f5;
              }
              .error-container {
                  background: white;
                  padding: 40px;
                  border-radius: 10px;
                  display: inline-block;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
          </style>
      </head>
      <body>
          <div class="error-container">
              <h1>404 - Link Not Found</h1>
              <p>The short link you're looking for doesn't exist.</p>
              <a href="/">Create a new short link</a>
          </div>
      </body>
      </html>
    `);
  }
  
  // Increment click counter
  urlData.clicks++;
  
  // Redirect to original URL
  res.redirect(urlData.originalUrl);
});

// API endpoint to get URL stats
app.get('/api/stats/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  const urlData = urlDatabase.get(shortCode);
  
  if (!urlData) {
    return res.status(404).json({ error: 'Short URL not found' });
  }
  
  res.json({
    originalUrl: urlData.originalUrl,
    shortCode,
    clicks: urlData.clicks,
    createdAt: urlData.createdAt
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔗 Link Shortener running on http://0.0.0.0:${PORT}`);
  console.log(`Ready to shorten URLs!`);
});
