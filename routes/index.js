import express from "express"
import pool from "../config/database.js"
import { body, param, validationResult } from "express-validator"

const router = express.Router()

router.get("/", async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT post.id, post.title, post.content, post.created_at, user.name
            FROM post
            JOIN user ON post.user_id = user.id
            ORDER BY post.created_at DESC
            `)
        res.render("index.njk", {title: "Litter", posts: rows, logged_in: req.session.authenticated})
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
            SELECT post.id, post.title, post.content, post.created_at, user.name, post.user_id
            FROM post
            JOIN user ON post.user_id = user.id
            WHERE post.id = ?
        `,
        [postId]
        )

        if (rows.length === 0) {
            throw new Error("Post not found :(")
        }

        res.render("post.njk", {post: rows[0], logged_in: req.session.authenticated, userId: req.session.userId})
    } catch (err) {
        next(err)
    }
})

router.get("/posts/:id/delete", param("id").isInt().withMessage("Post ID has to be an integer"), async (req, res, next) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        if (!req.session.authenticated) {
            return res.redirect("/")
        }

        const postId = req.params.id
        const [rows] = await pool.query(
            `
                SELECT post.user_id FROM post
                JOIN user ON post.user_id = user.id
            `
        )

        if (req.session.userId != rows[0].user_id) {
            return res.redirect("/")
        }
        
        await pool.query(
            `
                DELETE FROM post WHERE id = ?
            `,
            [postId]
        )

        res.redirect("/")

    } catch (err) {
        next(err)
    }
})

router.post("/posts", body("content").trim().notEmpty().escape(), async (req, res, next) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.render("error.njk")
        }

        const title = req.body.title
        const content = req.body.content
        const lineBreaks = (content.match(/\n/g)||[]).length

        if (lineBreaks <= 5) {
            await pool.query(
                `INSERT INTO post (title, content, user_id)
                VALUES (?, ?, ?)`,
                [title, content, req.session.userId]
            )
        } else {
            res.send('<script>alert("Too many newlines. Calm down buddy...")</script>')
        }
        res.redirect("/")
    } catch (err) {
        next(err)
    }
})

router.get('/error', (req, res) => {
    throw new Error('Test error')
})

export default router