import express from "express"
import bcrypt from "bcrypt"
import {body, validationResult} from "express-validator"
import pool from "../config/database.js"

const router = express.Router()

router.get("/test-hash/:password", async(req, res) => {
    const { password } = req.params
    const saltRounds = 10
    const hash = await bcrypt.hash(password, saltRounds)
    res.send(`Password: ${password}, Hash: ${hash}`)
})

router.get("/login", (req, res) => {
    res.render("login.njk", {
        title: "Log in"
    })
})

router.post("/login", body("username").trim().notEmpty().withMessage("Please provide a username"), body("password").notEmpty().withMessage("Please provide a password"), async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()})
    }

    const {username, password} = req.body

    try {
        const [rows] = await pool.query("select * FROM user WHERE name = ?", [username])
        const user = rows[0]

        if (!user) {
            return res.render("login.njk", {e_message: "Wrong username or password", title: "Log in"})
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.render("login.njk", {e_message: "Wrong username or password", title: "Log in"})
        }

        req.session.userId = user.id
        req.session.username = user.name
        req.session.authenticated = true

        return res.redirect("./profile")
    } catch (err) {
        console.error(err)
        res.status(500).json({error: "Whoops, something went wrong :("})
    }
})

router.get("/logout", (req, res) => {
    if (!req.session.authenticated) {
        res.render ("not_logged_in.njk", {title: "Log out page"})
        return
    }

    else {
        req.session.authenticated = false
        res.redirect("/")
    }
})

router.get("/signup", (req, res) => {
    res.render("signup.njk", {title: "Sign up"})
})

router.post("/signup", body("username").trim().notEmpty().withMessage("Please provide a username"), body("password").notEmpty().withMessage("Please provide a password"), async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()})
    }

    const username = req.body.username
    const password = await bcrypt.hash(req.body.password, 10)
    const email = req.body.email

    try {
        const [user_check] = await pool.query("SELECT * FROM user WHERE name = ?", [username])
        const [email_check] = await pool.query("SELECT * from user WHERE email = ?", [email])

        if (user_check[0]) {
            return res.render("signup.njk", {e_message: "Username already taken", title: "Sign up"})
        } else if (email_check[0]) {
            return res.render("signup.njk", {e_message: "Email already in use by somebody else", title: "Sign up"})
        }

        await pool.query(`
            INSERT INTO user (name, password, email)
            VALUES (?, ?, ?);
            `, [username, password, email]
        )

        const [rows] = await pool.query("SELECT * FROM user WHERE name = ?", [username])
        const user = rows[0]

        req.session.userId = user.id
        req.session.username = user.name
        req.session.authenticated = true

        return res.redirect("./profile")
    } catch (err) {
        console.log(err)
        res.render("error.njk")
    }
})

router.get("/profile", async (req, res) => {
    if (!req.session.authenticated) {
        res.render("not_logged_in.njk", {title: "Profile"})
        return
    }

    const [rows] = await pool.query(
        `SELECT post.id, post.title, post.content, post.created_at, user.name
        FROM post
        JOIN user ON post.user_id = user.id
        WHERE post.user_id = ?
        ORDER BY post.created_at DESC`,
        [req.session.userId]
    )

    res.render("profile.njk", {data: req.session, posts: rows, title: "Profile", logged_in: true})
})

export default router