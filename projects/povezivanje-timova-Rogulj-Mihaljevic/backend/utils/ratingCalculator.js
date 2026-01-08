// Rating calculation utility

// Izračunaj rank na temelju overall ratinga
const calculateRank = (rating) => {
  if (rating < 1200) return 'bronze';
  if (rating < 1500) return 'silver';
  if (rating < 1800) return 'gold';
  if (rating < 2200) return 'platinum';
  if (rating < 2600) return 'diamond';
  return 'master';
};

// Izračunaj attack rating
const calculateAttackRating = (stats) => {
  if (!stats || stats.totalMatches === 0) return 50;
  
  const goalsPerMatch = stats.totalMatches > 0 ? stats.totalGoals / stats.totalMatches : 0;
  const assistsPerMatch = stats.totalMatches > 0 ? (stats.totalAssists || 0) / stats.totalMatches : 0;
  
  // Formula: (golovi po utakmici * 30) + (asistencije po utakmici * 20)
  let attackRating = (goalsPerMatch * 30) + (assistsPerMatch * 20);
  
  // Bonus za visok broj golova
  if (stats.totalGoals > 50) attackRating += 10;
  if (stats.totalGoals > 100) attackRating += 10;
  
  return Math.min(Math.max(attackRating, 0), 100);
};

// Izračunaj defense rating
const calculateDefenseRating = (stats) => {
  if (!stats || stats.totalMatches === 0) return 50;
  
  const cleanSheetsPercentage = stats.totalMatches > 0 
    ? ((stats.totalCleanSheets || 0) / stats.totalMatches) * 100 
    : 0;
  
  const yellowCardsPerMatch = stats.totalMatches > 0 
    ? (stats.totalYellowCards || 0) / stats.totalMatches 
    : 0;
  
  const redCardsPerMatch = stats.totalMatches > 0 
    ? (stats.totalRedCards || 0) / stats.totalMatches 
    : 0;
  
  // Formula: clean sheets bonus - kartoni penalizacija
  let defenseRating = 50 + cleanSheetsPercentage;
  defenseRating -= (yellowCardsPerMatch * 10);
  defenseRating -= (redCardsPerMatch * 30);
  
  return Math.min(Math.max(defenseRating, 0), 100);
};

// Izračunaj teamwork rating (baziran na asistencijama i timskom uspjehu)
const calculateTeamworkRating = (stats) => {
  if (!stats || stats.totalMatches === 0) return 50;
  
  const assistsPerMatch = stats.totalMatches > 0 
    ? (stats.totalAssists || 0) / stats.totalMatches 
    : 0;
  
  const winRate = stats.totalMatches > 0 
    ? (stats.totalWins / stats.totalMatches) * 100 
    : 0;
  
  // Formula: (asistencije * 25) + (win rate * 0.3)
  let teamworkRating = (assistsPerMatch * 25) + (winRate * 0.3);
  
  return Math.min(Math.max(teamworkRating, 0), 100);
};

// Izračunaj consistency rating (koliko konzistentno igra)
const calculateConsistencyRating = (stats) => {
  if (!stats || stats.totalMatches === 0) return 50;
  
  const matchesPlayed = stats.totalMatches;
  const winRate = stats.totalMatches > 0 
    ? (stats.totalWins / stats.totalMatches) * 100 
    : 0;
  
  // Baziran na broju utakmica i win rate
  let consistencyRating = 30; // Base
  
  // Bonus za broj utakmica
  if (matchesPlayed >= 10) consistencyRating += 10;
  if (matchesPlayed >= 25) consistencyRating += 10;
  if (matchesPlayed >= 50) consistencyRating += 10;
  if (matchesPlayed >= 100) consistencyRating += 10;
  
  // Bonus/penalizacija za win rate
  consistencyRating += (winRate * 0.3);
  
  return Math.min(Math.max(consistencyRating, 0), 100);
};

// Glavni izračun overall ratinga
const calculateOverallRating = (attack, defense, teamwork, consistency) => {
  // Weighted average
  const weights = {
    attack: 0.30,
    defense: 0.25,
    teamwork: 0.25,
    consistency: 0.20
  };
  
  const weightedScore = 
    (attack * weights.attack) +
    (defense * weights.defense) +
    (teamwork * weights.teamwork) +
    (consistency * weights.consistency);
  
  // Konvertiraj iz 0-100 skale u 0-3000 skalu
  const overallRating = (weightedScore / 100) * 3000;
  
  return Math.round(overallRating);
};

// Glavna funkcija koja vraća kompletan rating objekt
const calculateUserRating = (userStats) => {
  const attack = calculateAttackRating(userStats);
  const defense = calculateDefenseRating(userStats);
  const teamwork = calculateTeamworkRating(userStats);
  const consistency = calculateConsistencyRating(userStats);
  const overall = calculateOverallRating(attack, defense, teamwork, consistency);
  const rank = calculateRank(overall);
  
  return {
    overall,
    attack: Math.round(attack),
    defense: Math.round(defense),
    teamwork: Math.round(teamwork),
    consistency: Math.round(consistency),
    rank,
    lastUpdated: new Date()
  };
};

module.exports = {
  calculateUserRating,
  calculateRank,
  calculateAttackRating,
  calculateDefenseRating,
  calculateTeamworkRating,
  calculateConsistencyRating,
  calculateOverallRating
};