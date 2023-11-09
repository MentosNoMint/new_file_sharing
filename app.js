const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3");
const cors = require("cors");

const port = 3000;
const DB = "./db/users.sqlite";
const secret = "mysecretkey";

app.use(express.json())
app.use(cors())

let db = new sqlite3.Database(DB, (error) => {
    if (error) {
        console.log("База данных не обнаружена");
        throw error;
    }
    else {
        db.run(`
        CREATE TABLE Users (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Username text,
            Password text,
            Salt text,
            Token text
        )`, (err) => {
            if (err) {
                console.log("Таблица уже создана");
            } else {
                const salt = bcrypt.genSaltSync(10);
                const token = jwt.sign({ userName: "user1" }, secret, { expiresIn: "1h" });
                const insert = "INSERT INTO Users (Username, Password, Salt, Token) VALUES (?,?,?,?)"
                db.run(insert, ["user1", bcrypt.hashSync("user1", salt), salt, token])

                console.log("Создание и заполнение таблицы")
            }
        });
    }
});

app.post("/file_sharing/registration", async (req, res) => {
    const { sign_name, sign_pass } = req.body;
    if (sign_name === undefined && sign_pass === undefined) {
        res.status(400).json({ message: "Поле имени или пароля не могут быть пустыми" })
        return
    }

    try {
        const salt = bcrypt.genSaltSync(10);
        const token = jwt.sign({ userName: sign_name }, secret, { expiresIn: "1h" });

        const checkName = await db.all(`SELECT * FROM Users WHERE Username = ?`);
        if (checkName.length > 0) {
            res.status(400).json({ message: "Пользователь с таким именем уже существует" })
            return;
        }
        else {
            const insert = "INSERT INTO Users (Username, Password, Salt, Token) VALUES (?,?,?,?)"
            await db.run(insert, [sign_name, bcrypt.hashSync(sign_pass, salt), salt, token], (err) => {
                if (err) {
                    return res.status(500).json({ message: "Ошибка при добавлении данных" });
                } else {
                    return res.status(200).json({ message: "Пользователь успешно зарегистрирован" });
                }
            });
            return;
        }
    }
    catch {
        res.status(500).json({ message: "Произошла ошибка при попытке регистрации пользователя" })
    }

});

app.post("/file_sharing/login", (req, res) => {
    const { auth_name, auth_pass } = req.body;
    if (auth_name === undefined && auth_pass === undefined) return res.status(400).json({ message: "Поле имени или пароля пусты" });
    
    //Неправильное сравнение
    try {
        const salt = bcrypt.genSaltSync(10);
        const hashPass = bcrypt.hashSync(auth_pass, salt);
        checkName = db.get("SELECT * FROM Users WHERE Name = ? AND Password = ?", [auth_name, hashPass], (err, row) => {
            if (err) return res.status(400).json({message: "Неверный логин или пароль"});
            return res.status(500).json({message: "Пользователь успешно авторизовался"})
        })
    }
    catch {
        res.status(500).json({ message: "Произошла ошибка при попытке авторизации логина пользователя" })
    }
})

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
})