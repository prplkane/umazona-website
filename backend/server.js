const express = require ('express');
const cors = require('cors');

const app = express();
const db = require ('./database.js');
const { startWatcher } = require ('./utils/csvWatcher.js');
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


//APIS
app.get('/', (req, res) => {
    res.send('Hello from the backend!');
})

app.post('/api/contacts', (req,res) => {
    const {name, phone, email, message} = req.body
    if (!name || !email) {
        return res.status(400).json({error: "Name and Email are required fields."})
    }
    const sql = `INSERT INTO contacts (name, phone, email, message) 
                 VALUES (?, ?, ?, ?)`;
    const params = [name, phone, email, message];
    
    db.run(sql, params, function (err) {
        if (err) {
            console.error(err.message)
            return res.status(500).json({error: "An error occurred while saving the contact."})
        }
        res.status(201).json({message: "Contact saved successfully.", data: {id: this.lastID, name: name, email: email}
    })
    })
})
    
app.get('/api/events', (req, res) => {
    const sql =`SELECT * FROM events ORDER BY event_date ASC`
    db.all (sql, [], (err, rows) => {
        if (err) {
            console.error(err.message)
            return res.status(500).json({error: "An error occurred while retrieving events."})
        }
        res.status(200).json({
            message: 'Events retrieved successfully.',
            data: rows
        })
    })
})

startWatcher()

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);   
})

