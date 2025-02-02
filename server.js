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
const fs = require('fs');

const app = express();
const port = 3000;

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

app.use(bodyParser.json());
app.use(helmet());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    storage: storage
});
/* const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos JPG e JPEG são permitidos.'));
        }
    }
});
 */

// Middleware para logar todas as requisições
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Rota para servir o formulário HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para servir o painel de visualização
app.get('/contatos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contatos.html'));
});

// Rota para receber o formulário preenchido
app.post('/submit-form', upload.single('photo'), [
    body('name').trim().isLength({
        min: 1
    }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('cellphone').trim().isLength({
        min: 10,
        max: 20
    }).escape(),
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
/*         res.json({
            message: 'Dados armazenados com sucesso.'
        }); */
        res.redirect('/');
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

// Rota para servir o painel de controle
app.get('/postagens', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'postagens.html'));
});

// Rota para receber os arquivos de mídia
app.post('/upload', upload.single('media'), (req, res) => {
    const {
        type,
        caption
    } = req.body;
    const file_path = req.file ? req.file.filename : null;

    const sql = 'INSERT INTO media (type, file_path, caption) VALUES (?, ?, ?)';
    db.query(sql, [type, file_path, caption], (err, result) => {
        if (err) throw err;
        res.redirect('/postagens');
    });
});

// Rota para obter os arquivos de mídia
app.get('/api/media', (req, res) => {
    const sql = 'SELECT * FROM media ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao obter mídia do banco de dados:', err);
            res.status(500).send('Erro ao obter a mídia.');
            return;
        }
        console.log(results);
        res.json(results);
    });
});

// Rota para obter dados da tabela 'media'
app.get('/data', (req, res) => {
    let sql = 'SELECT * FROM media';
    db.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        res.json(results);
    });
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});