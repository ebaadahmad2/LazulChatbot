export default async function handler(req, res) {
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
    const { message, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Build messages array with conversation history
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant for Lazul, a creative agency. Be friendly, professional, and concise.',
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory.slice(-10));
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile', // ✅ Updated to current model
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      return res.status(500).json({ 
        error: 'AI service error'
      });
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content;

    if (!aiMessage) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    return res.status(200).json({ response: aiMessage });

  } catch (error) {
    console.error('Error in chat handler:', error);
    return res.status(500).json({ 
      error: 'Something went wrong. Please try again.',
    });
  }
}
