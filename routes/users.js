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

        return res.json({message: "User logged in!", user})
    } catch (err) {
        console.error(err)
        res.status(500).json({error: "Whoops, something went wrong :("})
    }
})

export default router