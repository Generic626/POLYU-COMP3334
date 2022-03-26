require("dotenv").config();
const express = require("express");
const app = express();
const auth = require('./routes/auth')
const register = require('./routes/register')

app.use('/', auth);
app.use('/register', register);

app.listen(process.env.PORT, function(){
    console.log("listening to port "+ process.env.PORT);
});