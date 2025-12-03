import express from "express"

const router = express.Router()

router.get("/", (req, res) => {
    res.render("index.njk",
        { title: "Node js startrepo", message: "Använd det här repot som en grund för dina projekt." }
    )
})

router.get('/error', (req, res) => {
    throw new Error('Test error')
})

router.get("/login", (req, res) => {
    res.render("login.njk", {
        title: "Log in"
    })
})

export default router