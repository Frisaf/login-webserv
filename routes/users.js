import express from "express"
import bcrypt from "bcrypt"

const router = express.Router()

router.get("/test-hash/:password", async(req, res) => {
    const { password } = req.params
    const saltRounds = 10
    const hash = await bcrypt.hash(password, saltRounds)
    res.send(`Password: ${password}, Hash: ${hash}`)
})

export default router