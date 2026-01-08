const { body, param, query, validationResult } = require('express-validator');

// Helper da provjerava validaciju
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validacijska greška',
      errors: errors.array() 
    });
  }
  next();
};

// Validatori za auth
const registerValidator = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username mora biti između 3-30 karaktera')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username može sadržavati samo slova, brojeve i _'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Unesite valjan email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Lozinka mora imati minimalno 6 karaktera'),
    // ✅ Uklonio sam strogi .matches() - sada prihvaća bilo koju lozinku 6+ karaktera
  
  // ✅ NOVO - sport i location kao optional:
  body('sport')
    .optional()
    .trim()
    .escape(),
  
  body('location')
    .optional()
    .trim()
    .escape(),
  
  validate
];

const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Unesite valjan email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Lozinka je obavezna'),
  
  validate
];

// Validatori za team
const createTeamValidator = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Ime tima mora biti između 3-50 karaktera')
    .escape(),
  
  body('sport')
    .trim()
    .notEmpty()
    .withMessage('Sport je obavezan')
    .escape(),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('Grad je obavezan')
    .escape(),
  
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Lokacija je obavezna')
    .escape(),
  
  body('date')
    .isISO8601()
    .withMessage('Nevažeći datum')
    .toDate(),
  
  body('time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Nevažeće vrijeme (format HH:MM)'),
  
  body('maxPlayers')
    .isInt({ min: 2, max: 100 })
    .withMessage('Broj igrača mora biti između 2-100'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Opis može imati maksimalno 500 karaktera')
    .escape(),
  
  validate
];

// Validatori za tournament
const createTournamentValidator = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Ime turnira mora biti između 3-100 karaktera')
    .escape(),
  
  body('sport')
    .trim()
    .notEmpty()
    .withMessage('Sport je obavezan')
    .escape(),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('Grad je obavezan')
    .escape(),
  
  body('startDate')
    .isISO8601()
    .withMessage('Nevažeći datum početka')
    .toDate(),
  
  body('endDate')
    .isISO8601()
    .withMessage('Nevažeći datum završetka')
    .toDate()
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('Datum završetka mora biti nakon datuma početka');
      }
      return true;
    }),
  
  body('maxTeams')
    .isInt({ min: 2, max: 128 })
    .withMessage('Broj timova mora biti između 2-128'),
  
  body('teamSize')
    .isInt({ min: 1, max: 50 })
    .withMessage('Veličina tima mora biti između 1-50'),
  
  body('entryFee')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Cijena prijave mora biti između 0-10000€'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Opis može imati maksimalno 1000 karaktera')
    .escape(),
  
  validate
];

// Validatori za field
const createFieldValidator = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Ime terena mora biti između 3-100 karaktera')
    .escape(),
  
  body('sport')
    .trim()
    .notEmpty()
    .withMessage('Sport je obavezan')
    .escape(),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('Grad je obavezan')
    .escape(),
  
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Adresa mora biti između 5-200 karaktera')
    .escape(),
  
  body('price')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Cijena mora biti između 0-1000€'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Opis može imati maksimalno 500 karaktera')
    .escape(),
  
  validate
];

// Validatori za profile
const updateProfileValidator = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Ime može imati maksimalno 50 karaktera')
    .escape(),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Prezime može imati maksimalno 50 karaktera')
    .escape(),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio može imati maksimalno 500 karaktera')
    .escape(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
    .withMessage('Nevažeći format telefona'),
  
  body('instagram')
    .optional()
    .trim()
    .matches(/^[A-Za-z0-9._]+$/)
    .withMessage('Nevažeći Instagram username'),
  
  body('twitter')
    .optional()
    .trim()
    .matches(/^[A-Za-z0-9_]+$/)
    .withMessage('Nevažeći Twitter username'),
  
  validate
];

// Validatori za stats
const addMatchValidator = [
  body('sport')
    .trim()
    .notEmpty()
    .withMessage('Sport je obavezan')
    .escape(),
  
  body('matchData.opponent')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Protivnik mora biti između 2-100 karaktera')
    .escape(),
  
  body('matchData.result')
    .isIn(['win', 'loss', 'draw'])
    .withMessage('Rezultat mora biti: win, loss ili draw'),
  
  body('matchData.goalsScored')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Broj golova mora biti između 0-50'),
  
  body('matchData.assists')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Broj asistencija mora biti između 0-50'),
  
  validate
];

// ID validatori
const mongoIdValidator = [
  param('id').isMongoId().withMessage('Nevažeći ID'),
  validate
];

const teamIdValidator = [
  param('teamId').isMongoId().withMessage('Nevažeći team ID'),
  validate
];

const tournamentIdValidator = [
  param('tournamentId').isMongoId().withMessage('Nevažeći tournament ID'),
  validate
];

const matchIdValidator = [
  param('matchId').isMongoId().withMessage('Nevažeći match ID'),
  validate
];

module.exports = {
  registerValidator,
  loginValidator,
  createTeamValidator,
  createTournamentValidator,
  createFieldValidator,
  updateProfileValidator,
  addMatchValidator,
  mongoIdValidator,
  teamIdValidator,
  tournamentIdValidator,
  matchIdValidator
};