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
        console.log(user)

        if (!user) {
            return res.status(401).json({error: "Wrong username or password"})
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(401).json({error: "Wrong username or password"})
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

router.get("/profile", async (req, res) => {
    if (!req.session.authenticated) {
        return res.status(410).json({error: "You need to be logged in to view this page."})
    }

    const [rows] = await pool.query(
        `SELECT post.id, post.title, post.content, post.created_at, user.name
        FROM post
        JOIN user ON post.user_id = user.id
        WHERE post.user_id = ?
        ORDER BY post.created_at DESC`,
        [req.session.userId]
    )

    res.render("profile.njk", {data: req.session, posts: rows})
})

export default router