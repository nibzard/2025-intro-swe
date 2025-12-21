// Pretraživanje timova
document.getElementById('searchBtn').addEventListener('click', () => {
    const sport = document.getElementById('sportSelect').value;
    const location = document.getElementById('locationSelect').value;
    const teams = document.querySelectorAll('.team-card');

    teams.forEach(team => {
        const teamSport = team.getAttribute('data-sport');
        const teamLocation = team.getAttribute('data-location');

        if ((sport === '' || sport === teamSport) && (location === '' || location === teamLocation)) {
            team.style.display = 'block';
        } else {
            team.style.display = 'none';
        }
    });
});

// Pridruživanje timu
const joinButtons = document.querySelectorAll('.joinBtn');
joinButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const teamName = btn.parentElement.querySelector('h3').innerText;
        alert(`Pridružili ste se timu: ${teamName}`);
    });
});
