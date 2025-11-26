export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API key
  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY not found');
    return res.status(500).json({ 
      error: 'Server configuration error: API key missing' 
    });
  }

  const { messages } = req.body;

  if (!messages) {
    return res.status(400).json({ error: 'Messages required' });
  }

  try {
    console.log('Calling Groq API...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    console.log('Groq response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      return res.status(response.status).json({ 
        error: 'Groq API error', 
        details: errorText 
      });
    }

    const data = await response.json();
    console.log('Success!');
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Request failed:', error);
    return res.status(500).json({ 
      error: 'Request failed', 
      message: error.message 
    });
  }
}
