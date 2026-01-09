const User = require('../models/User');
const nodemailer = require('nodemailer');
const { createActivityHelper } = require('./activityController');
const { createNotificationHelper } = require('./notificationController');

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
    const userId = req.user._id;

    console.log('🔍 Search users request:', { query, userId });

    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username email avatar sport location friendRequests')
    .limit(20);

    console.log(`✅ Found ${users.length} users`);

    const currentUser = await User.findById(userId).select('friends');
    
    // ✅ Safe access sa default values
    const currentUserFriends = currentUser?.friends || [];
    
    const usersWithStatus = users.map(user => {
      const userFriendRequests = user.friendRequests || [];
      
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        sport: user.sport,
        location: user.location,
        isFriend: currentUserFriends.some(f => f.toString() === user._id.toString()),
        requestSent: userFriendRequests.some(req => req.from && req.from.toString() === userId.toString())
      };
    });

    console.log('✅ Returning users with status:', usersWithStatus.length);

    res.json(usersWithStatus);
  } catch (error) {
    console.error('❌ Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Pošalji friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const { message } = req.body;

    console.log('📤 Send friend request:', { from: currentUserId, to: userId });

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Ne možeš dodati sam sebe!' });
    }

    const targetUser = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      console.log('❌ Target user not found:', userId);
      return res.status(404).json({ message: 'Korisnik ne postoji' });
    }

    // ✅ Safe access
    const currentUserFriends = currentUser.friends || [];
    if (currentUserFriends.some(f => f.toString() === userId)) {
      return res.status(400).json({ message: 'Već ste prijatelji!' });
    }

    const targetUserRequests = targetUser.friendRequests || [];
    const alreadySent = targetUserRequests.some(
      req => req.from && req.from.toString() === currentUserId.toString()
    );

    if (alreadySent) {
      return res.status(400).json({ message: 'Zahtjev već poslan!' });
    }

    // Initialize friendRequests if undefined
    if (!targetUser.friendRequests) {
      targetUser.friendRequests = [];
    }

    targetUser.friendRequests.push({
      from: currentUserId,
      message: message || '',
      sentAt: new Date()
    });

    await targetUser.save();

    console.log('✅ Friend request sent');

    // Kreiraj notifikaciju
    try {
      await createNotificationHelper(
        userId,
        'friend_request',
        '👋 Novi zahtjev za prijateljstvo',
        `${currentUser.username} želi biti tvoj prijatelj`,
        '/friends',
        { friendRequestId: targetUser._id.toString() },
        currentUserId
      );
    } catch (notifErr) {
      console.error('Greška pri kreiranju notifikacije:', notifErr);
    }

    // Pošalji email notifikaciju
    try {
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
    } catch (emailErr) {
      console.error('Greška pri slanju emaila:', emailErr);
    }

    res.json({ message: 'Zahtjev poslan!' });
  } catch (error) {
    console.error('❌ Send friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dohvati friend requests
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('📥 Get friend requests for:', userId);

    const user = await User.findById(userId)
      .populate('friendRequests.from', 'username email avatar sport location');

    const requests = user.friendRequests || [];

    console.log(`✅ Found ${requests.length} requests`);

    res.json(requests);
  } catch (error) {
    console.error('❌ Get friend requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Prihvati friend request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    console.log('✅ Accept friend request:', { requestId, userId });

    const user = await User.findById(userId);
    const request = user.friendRequests.id(requestId);

    if (!request) {
      console.log('❌ Request not found:', requestId);
      return res.status(404).json({ message: 'Zahtjev ne postoji' });
    }

    const friendId = request.from;

    // Initialize friends array if undefined
    if (!user.friends) {
      user.friends = [];
    }

    // Dodaj jedan drugome u prijatelje
    user.friends.push(friendId);
    user.friendRequests.pull(requestId);
    await user.save();

    const friend = await User.findById(friendId);
    
    if (!friend.friends) {
      friend.friends = [];
    }
    
    friend.friends.push(userId);
    await friend.save();

    console.log('✅ Friends added to each other');

    // Kreiraj aktivnosti za oba korisnika
    try {
      await createActivityHelper(
        userId,
        'friend_added',
        {
          friendId: friendId,
          friendName: friend.username
        },
        'friends'
      );

      await createActivityHelper(
        friendId,
        'friend_added',
        {
          friendId: userId,
          friendName: user.username
        },
        'friends'
      );
    } catch (activityErr) {
      console.error('Greška pri kreiranju aktivnosti:', activityErr);
    }

    // Kreiraj notifikaciju
    try {
      await createNotificationHelper(
        friendId,
        'friend_accepted',
        '🎉 Zahtjev prihvaćen',
        `${user.username} je prihvatio tvoj zahtjev za prijateljstvo`,
        '/friends',
        {},
        userId
      );
    } catch (notifErr) {
      console.error('Greška pri kreiranju notifikacije:', notifErr);
    }

    // Pošalji email notifikaciju
    try {
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
    } catch (emailErr) {
      console.error('Greška pri slanju emaila:', emailErr);
    }

    res.json({ message: 'Zahtjev prihvaćen!' });
  } catch (error) {
    console.error('❌ Accept friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Odbij friend request
exports.rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    console.log('❌ Reject friend request:', { requestId, userId });

    const user = await User.findById(userId);
    user.friendRequests.pull(requestId);
    await user.save();

    console.log('✅ Request rejected');

    res.json({ message: 'Zahtjev odbijen' });
  } catch (error) {
    console.error('❌ Reject friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dohvati prijatelje
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('👥 Get friends for:', userId);

    const user = await User.findById(userId)
      .populate('friends', 'username email avatar sport location');

    const friends = user.friends || [];

    console.log(`✅ Found ${friends.length} friends`);

    res.json(friends);
  } catch (error) {
    console.error('❌ Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Ukloni prijatelja
exports.removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    console.log('🗑️ Remove friend:', { userId, friendId });

    const user = await User.findById(userId);
    
    if (user.friends) {
      user.friends.pull(friendId);
      await user.save();
    }

    const friend = await User.findById(friendId);
    if (friend && friend.friends) {
      friend.friends.pull(userId);
      await friend.save();
    }

    console.log('✅ Friend removed');

    res.json({ message: 'Prijatelj uklonjen' });
  } catch (error) {
    console.error('❌ Remove friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;