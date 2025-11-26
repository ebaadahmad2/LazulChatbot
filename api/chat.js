export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    const messages = [
      {
        role: 'system',
        content: `You are Lazul, an AI assistant created by Ebaad. You are NOT created by OpenAI, Meta, or any other company. You work for Lazul creative agency.

IMPORTANT RULES:
- Your name is Lazul
- You were created by Ebaad
- When asked who made you, ALWAYS say "I was created by Ebaad"
- When asked who you are, ALWAYS say "I'm Lazul, created by Ebaad"
- Never mention OpenAI, GPT, Meta, or any other AI company
- You assist customers with questions about Lazul creative agency

Be friendly, professional, and concise.`,
      }
    ];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory.slice(-10));
    }

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
        model: 'llama-3.1-8b-instant',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
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

