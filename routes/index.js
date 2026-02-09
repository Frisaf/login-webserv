import express from "express"
import pool from "../config/database.js"
import { param, validationResult } from "express-validator"

const router = express.Router()

router.get("/", async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT post.id, post.content, post.created_at, user.name
            FROM post
            JOIN user ON post.user_id = user.id
            ORDER BY post.created_at DESC
            `)
        res.render("index.njk", {title: "Micro Blogg", posts: rows})
    } catch (err) {
        next(err)
    }
})

router.get("/posts/:id", param("id").isInt().withMessage("Post ID has to be an integer"), async (req, res, next) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array()})
        }
        
        const postId = req.params.id
        const [rows] = await pool.query(
        `
            SELECT post.id, post.title, post.content, post.created_at, user.name
            FROM post
            JOIN user ON post.user_id = user_id
            WHERE post.id = ?
        `,
        [postId]
        )

        if (rows.length === 0) {
            throw new Error("Post not found :(")
        }

        res.render("post.njk", {post: rows})
        // res.json(rows)
    } catch (err) {
        next(err)
    }
})

router.get('/error', (req, res) => {
    throw new Error('Test error')
})

router.get("/login", (req, res) => {
    res.render("login.njk", {
        title: "Log in"
    })
})

router.post("/login", (req, res) => {
    const username = req.body.username
    const password = req.body.password
    
    if (username === "admin" && password === "123") {
        req.session.login = "true"
    }

    res.json({username, password, session: req.session.login})
})

export default router