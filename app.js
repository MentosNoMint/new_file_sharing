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

app.post("/file_sharing/login", async (req, res) => {
    try {
        const { auth_name, auth_pass } = req.body;

        if (!(auth_name && auth_pass)) return res.status(400).json({ message: "Требуется ввод данных" });

        let user = [];

        const sql = "SELECT * FROM Users WHERE Username = ?";
        db.all(sql, auth_name, (err, rows) => {
            if (err) return res.status(400).json({ "error": err.message });
            rows.forEach(function (row) {
                user.push(row);
            })
            const PHash = bcrypt.hashSync(auth_pass, user[0].Salt);

            if (PHash === user[0].Password) {
                const token = jwt.sign({ userId: user[0].Id, userName: user[0].Username, auth_name }, secret, { expiresIn: "1h" });

                user[0].Token = token;
            } else {
                return res.status(200).json({message: "Совпадений нет"});
            }
            
            return res.status(200).json({message: "Пользователь успешно авторизовался"})
        });
    }
    catch {
        return res.status(400).json({ message: "Произошла ошибка при попытке авторизации пользователя" });
    }
})

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
})