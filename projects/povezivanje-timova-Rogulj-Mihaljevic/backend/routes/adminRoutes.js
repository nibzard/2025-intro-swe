const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Team = require('../models/Team');

// ⚠️ ADMIN ONLY - Cleanup entire database
router.post('/cleanup', async (req, res) => {
  try {
    const { confirmCode } = req.body;
    
    if (confirmCode !== 'DELETE_ALL_2026') {
      return res.status(403).json({ message: 'Invalid confirmation code' });
    }

    const deletedUsers = await User.deleteMany({});
    const deletedTeams = await Team.deleteMany({});

    res.json({
      message: '🗑️ Database cleaned successfully!',
      deletedUsers: deletedUsers.deletedCount,
      deletedTeams: deletedTeams.deletedCount
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ message: 'Cleanup failed' });
  }
});

// Delete specific user by email
router.post('/delete-user', async (req, res) => {
  try {
    const { email, confirmCode } = req.body;
    
    if (confirmCode !== 'DELETE_USER_2026') {
      return res.status(403).json({ message: 'Invalid confirmation code' });
    }

    const user = await User.findOneAndDelete({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all teams created by this user
    await Team.deleteMany({ creator: user._id });

    res.json({
      message: `User ${email} deleted successfully!`,
      userId: user._id
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Delete failed' });
  }
});

// Fix "unknown" teams - delete teams with deleted creators
router.post('/fix-unknown-teams', async (req, res) => {
  try {
    const { confirmCode } = req.body;
    
    if (confirmCode !== 'FIX_TEAMS_2026') {
      return res.status(403).json({ message: 'Invalid confirmation code' });
    }

    const teams = await Team.find({}).populate('creator');
    
    let deletedCount = 0;
    
    for (const team of teams) {
      if (!team.creator) {
        await Team.findByIdAndDelete(team._id);
        deletedCount++;
      }
    }

    res.json({
      message: `Fixed! Deleted ${deletedCount} teams with missing creators.`,
      deletedCount
    });
  } catch (error) {
    console.error('Fix teams error:', error);
    res.status(500).json({ message: 'Fix failed' });
  }
});

// List all users (debugging)
router.get('/list-all-users', async (req, res) => {
  try {
    const users = await User.find({}).select('username email createdAt isVerified');
    
    res.json({
      count: users.length,
      users: users.map(u => ({
        id: u._id,
        username: u.username,
        email: u.email,
        verified: u.isVerified,
        created: u.createdAt
      }))
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ message: 'Failed to list users' });
  }
});

// Get verification code for email (debugging)
router.post('/get-verification-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email }).select('email verificationCode isVerified');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      email: user.email,
      verificationCode: user.verificationCode,
      isVerified: user.isVerified
    });
  } catch (error) {
    console.error('Get code error:', error);
    res.status(500).json({ message: 'Failed' });
  }
});

// ⚡ INSTANT VERIFY - Bypass verification code
router.post('/instant-verify', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        message: 'User is already verified',
        userId: user._id,
        username: user.username
      });
    }

    // Instant verify - bypass code
    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    console.log('⚡ Instant verified:', user.email);

    res.json({
      message: `✅ User ${email} instantly verified!`,
      userId: user._id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('Instant verify error:', error);
    res.status(500).json({ message: 'Instant verify failed' });
  }
});

module.exports = router;