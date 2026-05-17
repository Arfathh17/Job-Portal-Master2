/**
 * Chatbot Route — REST endpoint for AI chat
 * Falls back to mock responses when OpenAI key is unavailable
 */
const express = require('express');
const router = express.Router();

// Use the chatbot service (which handles OpenAI/mock internally)
const chatbotService = require('../services/chatbot');

// ─── POST /api/chatbot/message ─────────────────────────────────────────────────
router.post('/message', async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const response = await chatbotService.processMessage(userId || 'anonymous', message);
    res.json(response);
  } catch (err) {
    console.error('Chatbot route error:', err);
    res.status(500).json({ error: 'Failed to process message.', message: 'Sorry, something went wrong. Please try again.' });
  }
});

// ─── DELETE /api/chatbot/history/:userId ────────────────────────────────────────
router.delete('/history/:userId', (req, res) => {
  chatbotService.clearHistory(req.params.userId);
  res.json({ success: true, message: 'Chat history cleared.' });
});

module.exports = router;
