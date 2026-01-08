const User = require('../models/User');
const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Pretraži korisnike
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $ne: userId }, // Isključi trenutnog korisnika
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username email avatar sport location')
    .limit(20);

    // Dodaj info o već poslanim zahtjevima
    const currentUser = await User.findById(userId);
    const usersWithStatus = users.map(user => ({
      ...user.toObject(),
      isFriend: currentUser.friends.includes(user._id),
      requestSent: user.friendRequests.some(req => req.from.toString() === userId)
    }));

    res.json(usersWithStatus);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Pošalji friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { message } = req.body;

    if (userId === currentUserId) {
      return res.status(400).json({ message: 'Ne možeš dodati sam sebe!' });
    }

    const targetUser = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ message: 'Korisnik ne postoji' });
    }

    // Provjeri jel već prijatelj
    if (currentUser.friends.includes(userId)) {
      return res.status(400).json({ message: 'Već ste prijatelji!' });
    }

    // Provjeri jel već poslao zahtjev
    const alreadySent = targetUser.friendRequests.some(
      req => req.from.toString() === currentUserId
    );

    if (alreadySent) {
      return res.status(400).json({ message: 'Zahtjev već poslan!' });
    }

    // Dodaj zahtjev
    targetUser.friendRequests.push({
      from: currentUserId,
      message: message || '',
      sentAt: new Date()
    });

    await targetUser.save();

    // Pošalji email notifikaciju
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: targetUser.email,
      subject: `👋 ${currentUser.username} želi biti tvoj prijatelj na TeamConnect`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #667eea; text-align: center;">👋 Novi zahtjev za prijateljstvo!</h1>
          
          <div style="background: #f5f7fa; padding: 30px; border-radius: 15px; margin: 20px 0;">
            <p style="font-size: 18px; color: #333;">
              <strong>${currentUser.username}</strong> želi biti tvoj prijatelj na TeamConnect!
            </p>
            
            ${message ? `
              <div style="background: white; padding: 15px; border-radius: 10px; margin: 15px 0; border-left: 4px solid #667eea;">
                <p style="margin: 0; color: #666; font-style: italic;">"${message}"</p>
              </div>
            ` : ''}
            
            <p style="margin-top: 20px;">
              <strong>Sport:</strong> ${currentUser.sport || 'Nije navedeno'}<br>
              <strong>Lokacija:</strong> ${currentUser.location || 'Nije navedeno'}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/friends" 
               style="background: linear-gradient(135deg, #667eea, #764ba2); 
                      color: white; 
                      padding: 15px 40px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold;
                      display: inline-block;">
              Vidi zahtjev
            </a>
          </div>
          
          <p style="color: #999; text-align: center; font-size: 14px;">
            TeamConnect - Povežite se s igračima 🏆
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Zahtjev poslan!' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dohvati friend requests
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('friendRequests.from', 'username email avatar sport location');

    res.json(user.friendRequests || []);
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Prihvati friend request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const request = user.friendRequests.id(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Zahtjev ne postoji' });
    }

    const friendId = request.from;

    // Dodaj jedan drugome u prijatelje
    user.friends.push(friendId);
    user.friendRequests.pull(requestId);
    await user.save();

    const friend = await User.findById(friendId);
    friend.friends.push(userId);
    await friend.save();

    // Pošalji email notifikaciju
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: friend.email,
      subject: `🎉 ${user.username} je prihvatio tvoj zahtjev za prijateljstvo!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4caf50; text-align: center;">🎉 Sada ste prijatelji!</h1>
          
          <div style="background: #f5f7fa; padding: 30px; border-radius: 15px; margin: 20px 0; text-align: center;">
            <p style="font-size: 18px; color: #333;">
              <strong>${user.username}</strong> je prihvatio tvoj zahtjev za prijateljstvo!
            </p>
            <p style="font-size: 16px; color: #666;">
              Sada možete zajedno igrati i pratiti jedni druge na TeamConnect.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/friends" 
               style="background: linear-gradient(135deg, #4caf50, #66bb6a); 
                      color: white; 
                      padding: 15px 40px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold;
                      display: inline-block;">
              Vidi prijatelje
            </a>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Zahtjev prihvaćen!' });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Odbij friend request
exports.rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    user.friendRequests.pull(requestId);
    await user.save();

    res.json({ message: 'Zahtjev odbijen' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dohvati prijatelje
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('friends', 'username email avatar sport location');

    res.json(user.friends || []);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Ukloni prijatelja
exports.removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    user.friends.pull(friendId);
    await user.save();

    const friend = await User.findById(friendId);
    friend.friends.pull(userId);
    await friend.save();

    res.json({ message: 'Prijatelj uklonjen' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;