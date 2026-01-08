const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Dohvati profil
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const user = await User.findById(userId)
      .select('-password -verificationCode')
      .populate('friends', 'username avatar');

    if (!user) {
      return res.status(404).json({ message: 'Korisnik ne postoji' });
    }

    // Provjeri privatnost
    const isSelf = userId === currentUserId;
    const isFriend = user.friends.some(f => f._id.toString() === currentUserId);

    if (user.profileVisibility === 'private' && !isSelf) {
      return res.status(403).json({ message: 'Profil je privatan' });
    }

    if (user.profileVisibility === 'friends' && !isSelf && !isFriend) {
      return res.status(403).json({ message: 'Profil je vidljiv samo prijateljima' });
    }

    // Sakrij osjetljive podatke ako nije self
    if (!isSelf) {
      if (!user.showEmail) user.email = undefined;
      if (!user.showPhone) user.phone = undefined;
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Ažuriraj profil
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Ne dozvoljavaj ažuriranje osjetljivih polja
    delete updates.password;
    delete updates.email;
    delete updates._id;
    delete updates.friends;
    delete updates.friendRequests;
    delete updates.createdAt;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -verificationCode');

    res.json({ message: 'Profil ažuriran!', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Promijeni lozinku
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Popuni sva polja!' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Nova lozinka mora imati barem 6 znakova!' });
    }

    const user = await User.findById(userId);
    
    // Provjeri trenutnu lozinku
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Trenutna lozinka nije točna!' });
    }

    // Hash nova lozinka
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Lozinka promijenjena!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar } = req.body; // Emoji ili URL

    if (!avatar) {
      return res.status(400).json({ message: 'Avatar nije poslan!' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { avatar } },
      { new: true }
    ).select('-password -verificationCode');

    res.json({ message: 'Avatar ažuriran!', user });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dohvati aktivnost korisnika
exports.getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;

    // TODO: Implementiraj dohvat aktivnosti iz različitih kolekcija
    // (timovi kreirani, utakmice, videi, komentari, itd.)

    res.json({ 
      message: 'Activity coming soon',
      activities: [] 
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;