require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware-uri esențiale (trebuie să fie înaintea rutelor!)
app.use(cors());          // Permite frontend-ului să comunice cu tine
app.use(express.json());  // Permite serverului să înțeleagă datele JSON trimise de frontend

