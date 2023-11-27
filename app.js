const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const port = 3000;
const DB = "./db/users.sqlite";
const secret = "mysecretkey";

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "files"); // Используйте относительный путь
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post("/upload", upload.single("up_file"), (req, res) => {
    const { originalname, path } = req.file;

    const insert = "INSERT INTO Files(Name, Path) VALUES(?,?)";
    dbFiles.run(insert, [originalname, path], function (err) {
        if (err) {
            return res.status(500).send(err.message);
        }

        console.log(`Файл ${originalname} успешно загрузился под id ${this.lastID}`);
        res.send("Файл успешно загрузился");
    });
});

let dbFiles = new sqlite3.Database(DB, (error) => {
    if (error) {
        console.log("База данных не обнаружена")
        throw error
    }
    else {
        dbFiles.run(`
        CREATE TABLE Files(
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Name text,
            Path text
        )`, (err) => {
            if (err) {
                console.log("Таблица с файлами уже создана")
            }
            else {
                console.log("Создаётся таблица с файлами")
            }
        })
    }
})

app.get("/getFiles", (req, res) => {
    dbFiles.all("SELECT * FROM Files", (err, rows) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.json(rows);
    });
});

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

        const checkName = await db.get(`SELECT Username FROM Users WHERE Username = ?`, sign_name);
        if (!(checkName)) {
            res.status(400).json({ message: "Пользователь с таким именем уже существует" });
            return;
        }
        else {
            const insert = "INSERT INTO Users (Username, Password, Salt) VALUES (?,?,?)"
            await db.run(insert, [sign_name, bcrypt.hashSync(sign_pass, salt), salt], (err) => {
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
        db.get("SELECT * FROM Users WHERE Username = ?", auth_name, (err, row) => {
            if (err) {
                return res.status(401).json({ message: "Такого пользователя несуществует" });
            } else {
                console.log(row.Password)
                bcrypt.compare(auth_pass, row.Password, (err, result) => {
                    if (result) {
                        const name = row.Username;
                        const token = jwt.sign({ Username: auth_name, Password: row.Password }, secret, { expiresIn: "1h" });
                        const data = {
                            UserName: name,
                            Token: token
                        }
                        return res.json(data)
                    } else {
                        return res.status(401).json({ message: "Логин или пароль неверны" });
                    }
                })
            }
        });
    } catch {
        return res.status(400).json({ message: "Произошла ошибка при попытке авторизации пользователя" });
    }
})

app.get("/users", async (req, res) => {
    try {
        const sql = "SELECT * FROM Users";
        await db.all(sql, (err, rows) => {
            if (err) return res.status(200).json({ message: "Неудалось получить пользователей" });
            rows.forEach(function (row) {
                console.log(row);
            })
        });
    }
    catch {
        return res.status(200).json({ message: "Неудалось сделать запрос получения всех пользователей" });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
})