const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// API endpoint for job search
app.post('/api/search-jobs', async (req, res) => {
    try {
        const { query, jobType } = req.body;
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01',
                'x-api-key': process.env.CLAUDE_API_KEY
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 2000,
                messages: [{
                    role: 'user',
                    content: `Find legitimate, quality ${jobType} jobs in Denver, Colorado area. Search criteria: ${query || ''}
                    
                    FOCUS ON:
                    - Jobs paying $17+ per hour for customer service, $18+ for warehouse
                    - Full-time positions with benefits
                    - Direct hire opportunities (not temp agencies)
                    - Legitimate companies with good reputations
                    - Recent job postings (within last 30 days)
                    
                    FILTER OUT:
                    - MLMs, pyramid schemes, commission-only jobs
                    - Temp agency postings
                    - Scam job listings
                    - Jobs requiring upfront payments
                    - Telemarketing/cold calling positions
                    
                    Return ONLY a JSON array with this structure:
                    [
                        {
                            "title": "Job Title",
                            "company": "Company Name", 
                            "location": "City, State",
                            "date": "2025-01-15",
                            "description": "Brief job description including pay rate if available",
                            "url": "Application URL if available"
                        }
                    ]
                    
                    Include salary/hourly rate in the description when possible. Prioritize jobs with clear pay rates and benefits.`
                }]
            })
        });

        const data = await response.json();
        const content = data.content[0].text;
        
        // Parse JSON response
        let jsonStr = content.trim();
        jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        const jobs = JSON.parse(jsonStr);
        res.json({ success: true, jobs });
        
    } catch (error) {
        console.error('Job search error:', error);
        res.status(500).json({ success: false, error: error.message });
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
