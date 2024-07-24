const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const {
    body,
    validationResult
} = require('express-validator');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const moment = require('moment-timezone');

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(helmet());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Metro@21061975',
    database: 'contatodb'
});

// Conectar ao banco de dados
db.connect(err => {
    if (err) throw err;
    console.log('Conectado ao banco de dados.');
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use(limiter);

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos JPG e JPEG são permitidos.'));
        }
    }
});

// Rota para servir o formulário HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para servir o painel de visualização
app.get('/painel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'painel.html'));
});

app.post('/submit-form', upload.single('photo'), [
    body('name').trim().isLength({
        min: 1
    }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('cellphone').trim().isLength({
        min: 10,
        max: 20
    }).escape(), // Ajuste na validação do cellphone
    body('service').trim().isIn(['WEB DESIGNER', 'SEO', 'MARKETING']).escape(),
    body('description').trim().isLength({
        min: 1
    }).escape(),
    body('date').isISO8601().toDate()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    const {
        name,
        email,
        cellphone,
        service,
        description,
        date
    } = req.body;
    const photo = req.file ? req.file.filename : null;

    // Formatar a data para o formato correto considerando o fuso horário
    const formattedDate = moment.tz(date, 'YYYY-MM-DD', 'UTC').format('YYYY-MM-DD');

    const sql = 'INSERT INTO contato_web (name, email, cellphone, service, description, date, photo) VALUES (?, ?, ?, ?, ?, ?, ?)';

    db.query(sql, [name, email, cellphone, service, description, formattedDate, photo], (err, result) => {
        if (err) throw err;
        res.json({
            message: 'Dados armazenados com sucesso.'
        });
    });
});

// Rota para obter os dados do banco de dados
app.get('/api/data', (req, res) => {
    const sql = 'SELECT * FROM contato_web';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});