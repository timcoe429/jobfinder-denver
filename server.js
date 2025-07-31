const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// API endpoint for search query optimization
app.post('/api/optimize-search', async (req, res) => {
    try {
        const { jobType, salary, location, shift, requirements, filterScams } = req.body;
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01',
                'x-api-key': process.env.CLAUDE_API_KEY
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: `Help optimize this job search for Google. Current search criteria:
                    - Job Type: ${jobType || 'Not specified'}
                    - Salary: ${salary || 'Not specified'}
                    - Location: ${location || 'Not specified'}
                    - Shift: ${shift || 'Not specified'}
                    - Requirements: ${requirements || 'Not specified'}
                    - Filter Scams: ${filterScams ? 'Yes' : 'No'}
                    
                    Please suggest:
                    1. Better job keywords and synonyms
                    2. Additional salary search terms
                    3. Related skills or requirements to include
                    4. Industry-specific terms that would help
                    5. Better location variations
                    
                    Return ONLY a JSON object with this structure:
                    {
                        "suggestedJobKeywords": ["keyword1", "keyword2"],
                        "salaryTerms": ["term1", "term2"], 
                        "additionalRequirements": ["req1", "req2"],
                        "locationVariations": ["location1", "location2"],
                        "optimizedQuery": "complete optimized Google search string"
                    }`
                }]
            })
        });

        const data = await response.json();
        const content = data.content[0].text;
        
        // Parse JSON response
        let jsonStr = content.trim();
        jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        const optimization = JSON.parse(jsonStr);
        res.json({ success: true, optimization });
        
    } catch (error) {
        console.error('Query optimization error:', error);
        res.status(500).json({ success: false, error: 'Failed to optimize search query' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
    console.log(`JobFinder server running on port ${PORT}`);
});
