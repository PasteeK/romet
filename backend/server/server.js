const express = require('express');
const app = express();
const port = 3000;

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/romet')
    .then(() => console.log('Connected to MongoDB : Romet'))

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)})