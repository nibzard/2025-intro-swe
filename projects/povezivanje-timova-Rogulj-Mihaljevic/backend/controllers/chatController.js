const Team = require('../models/Team');

// Dohvati sve poruke tima
exports.getMessages = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    const { limit = 100, before } = req.query;

    const team = await Team.findById(teamId)
      .populate('messages.user', 'username avatar');

    if (!team) {
      return res.status(404).json({ message: 'Tim ne postoji' });
    }

    // Provjeri je li član
    const isMember = team.players.some(p => p.toString() === userId) || 
                     team.creator.toString() === userId;

    if (!isMember) {
      return res.status(403).json({ message: 'Nisi član tima' });
    }

    // Filtriraj poruke
    let messages = team.messages;
    
    if (before) {
      messages = messages.filter(m => new Date(m.createdAt) < new Date(before));
    }

    // Limtiraj i sortiraj
    messages = messages
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit))
      .reverse();

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Obriši poruku
exports.deleteMessage = async (req, res) => {
  try {
    const { teamId, messageId } = req.params;
    const userId = req.user.id;

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: 'Tim ne postoji' });
    }

    const message = team.messages.id(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Poruka ne postoji' });
    }

    // Samo vlasnik poruke ili kreator tima može obrisati
    if (message.user.toString() !== userId && team.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Nemaš pravo obrisati ovu poruku' });
    }

    team.messages.pull(messageId);
    await team.save();

    // Emit event preko Socket.io
    const io = req.app.get('io');
    io.to(`team_${teamId}`).emit('message_deleted', { messageId });

    res.json({ message: 'Poruka obrisana' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;