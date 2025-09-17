const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const USERS_FILE = './users.json';

// Crear archivo JSON si no existe
if(!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));

app.post('/register', (req, res) => {
    const {name, age, grade, email, password} = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_FILE));

    if(users.find(u => u.email === email)){
        return res.json({success:false, message:'El correo ya está registrado.'});
    }

    users.push({name, age, grade, email, password});
    fs.writeFileSync(USERS_FILE, JSON.stringify(users));
    res.json({success:true, message:'Usuario registrado correctamente!'});
});

app.post('/login', (req, res) => {
    const {email, password} = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_FILE));
    const user = users.find(u => u.email === email && u.password === password);
    if(user){
        res.json({success:true, message:'Login exitoso!'});
    } else {
        res.json({success:false, message:'Correo o contraseña incorrectos.'});
    }
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
