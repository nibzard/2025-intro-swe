import React from 'react';
import './BracketGenerator.css';

function BracketGenerator({ teams, matches, onUpdateMatch }) {
  // Generiraj bracket struktu za knockout
  const generateBracket = () => {
    if (!teams || teams.length === 0) return null;

    const rounds = Math.ceil(Math.log2(teams.length));
    const bracket = [];

    // Round 1
    const round1Matches = [];
    for (let i = 0; i < teams.length; i += 2) {
      if (teams[i + 1]) {
        round1Matches.push({
          id: `r1-m${i / 2}`,
          round: 1,
          team1: teams[i],
          team2: teams[i + 1],
          score1: null,
          score2: null,
          winner: null
        });
      }
    }
    bracket.push(round1Matches);

    // Ostali roundovi (placeholder)
    for (let r = 2; r <= rounds; r++) {
      const roundMatches = [];
      const prevRoundCount = bracket[r - 2].length;
      
      for (let i = 0; i < Math.ceil(prevRoundCount / 2); i++) {
        roundMatches.push({
          id: `r${r}-m${i}`,
          round: r,
          team1: null,
          team2: null,
          score1: null,
          score2: null,
          winner: null
        });
      }
      bracket.push(roundMatches);
    }

    return bracket;
  };

  const bracket = generateBracket();

  if (!bracket) {
    return (
      <div className="bracket-empty">
        <p>Čeka se prijava timova za generiranje bracket-a</p>
      </div>
    );
  }

  const getRoundName = (roundIndex, totalRounds) => {
    const remaining = totalRounds - roundIndex;
    if (remaining === 0) return 'Finale';
    if (remaining === 1) return 'Polufinale';
    if (remaining === 2) return 'Četvrtfinale';
    return `Runda ${roundIndex + 1}`;
  };

  return (
    <div className="bracket-generator">
      <div className="bracket-container">
        {bracket.map((round, roundIndex) => (
          <div key={roundIndex} className="bracket-round">
            <h3 className="round-title">
              {getRoundName(roundIndex, bracket.length)}
            </h3>
            <div className="round-matches">
              {round.map((match, matchIndex) => (
                <div key={match.id} className="bracket-match">
                  <div className={`match-team ${match.winner === match.team1?.name ? 'winner' : ''}`}>
                    <span className="team-name">
                      {match.team1?.name || 'TBD'}
                    </span>
                    <span className="team-score">
                      {match.score1 !== null ? match.score1 : '-'}
                    </span>
                  </div>
                  
                  <div className="match-vs">VS</div>
                  
                  <div className={`match-team ${match.winner === match.team2?.name ? 'winner' : ''}`}>
                    <span className="team-name">
                      {match.team2?.name || 'TBD'}
                    </span>
                    <span className="team-score">
                      {match.score2 !== null ? match.score2 : '-'}
                    </span>
                  </div>

                  {match.team1 && match.team2 && (
                    <button 
                      className="btn-enter-score"
                      onClick={() => onUpdateMatch && onUpdateMatch(match)}
                    >
                      Unesi rezultat
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bracket-legend">
        <h4>Legenda:</h4>
        <p><span className="legend-winner">■</span> Pobjednik</p>
        <p><span className="legend-tbd">TBD</span> - To Be Determined (Čeka se)</p>
      </div>
    </div>
  );
}

export default BracketGenerator;