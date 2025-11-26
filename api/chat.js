export default async function handler(req, res) {
  // DEBUG - Remove after fixing
  console.log('=== GROQ API KEY DEBUG ===');
  console.log('Key exists:', !!process.env.GROQ_API_KEY);
  console.log('Key length:', process.env.GROQ_API_KEY?.length || 0);
  console.log('Starts with gsk_:', process.env.GROQ_API_KEY?.startsWith('gsk_'));
  console.log('==========================');

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for Lazul, a creative agency.',
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', JSON.stringify(errorData));
      return res.status(response.status).json({ 
        error: 'AI service error',
        details: errorData 
      });
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'No response';

    return res.status(200).json({ response: aiMessage });

  } catch (error) {
    console.error('Error in chat handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
