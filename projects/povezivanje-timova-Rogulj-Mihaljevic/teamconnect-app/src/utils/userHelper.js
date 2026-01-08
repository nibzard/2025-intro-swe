// Helper funkcija za dohvat user ID-ja
export const getUserId = (user) => {
  return user._id || user.id;
};

// Helper funkcija za provjeru je li korisnik kreator
export const isCreator = (team, userId) => {
  const creatorId = typeof team.creator === 'object' ? team.creator._id : team.creator;
  return creatorId === userId;
};

// Helper funkcija za provjeru je li korisnik član
export const isMember = (team, userId) => {
  return team.players?.some(p => {
    const playerId = typeof p === 'object' ? p._id : p;
    return playerId === userId;
  });
};