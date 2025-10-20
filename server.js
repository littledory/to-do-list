const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/users', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.catch(err => console.error("Ошибка подключения:", err));

const userSchema = new mongoose.Schema({
    login: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    tasks: { type: [String], default: [] }
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/register', async (req, res) => {
    const { login, password, tasks } = req.body;

    try {
        const existingUser = await User.findOne({ login });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Этот логин уже занят.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ login, password: hashedPassword, tasks });
        await newUser.save();
        
        res.json({ success: true, message: 'Пользователь успешно зарегистрирован!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Ошибка сервера.' });
    }
});

app.post('/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        const user = await User.findOne({ login });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Данный логин не зарегистрирован в системе.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Неверный логин или пароль.' });
        }
        res.json({ success: true, message: 'Авторизация успешна!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Ошибка сервера.' });
    }
});

app.post('/load', async (req, res) => {
    const { login } = req.body;

    try {
        const user = await User.findOne({ login });
        const task = user.tasks;

        res.json({ success: true, 'task': task});
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Ошибка сервера.' });
    }
});

app.post('/add', async (req, res) => {
    const { login, task } = req.body;

    try {
        const user = await User.findOne({ login });
        const tasks = user.tasks;
        tasks.unshift(task)
        const updated = await User.findOneAndUpdate({ login },{ $set: { tasks } },{ new: task });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Ошибка сервера.' });
    }
});

app.post('/delete', async (req, res) => {
    const { login, task } = req.body; 

    try {
        const user = await User.findOne({ login });
        const updatedTasks = user.tasks.filter(t => t !== task); 
        await User.findOneAndUpdate({ login }, { $set: { tasks: updatedTasks } }, { new: true });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Ошибка сервера.' });
    }
});


app.listen(PORT)

