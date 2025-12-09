import "dotenv/config"
import express from "express"
import nunjucks from "nunjucks"
import morgan from 'morgan'
import session from "express-session"

import indexRouter from './routes/index.js'

const app = express()
const port = 3000 || process.env.PORT
const isProduction = process.env.NODE_ENV === 'production'

nunjucks.configure("views", {
  autoescape: true,
  express: app,
})

app.set('view engine', 'njk')
app.set('views', './views')

app.use(morgan('dev'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(express.static("public"))

app.use(session({
  secret: "super-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: true,
    secure: false,
    maxAge: 1000 * 60 * 60* 24
  }
}))

app.use("/", indexRouter)

app.use((req, res, next) => {
    res.status(404).send("Page not found :(")
})

app.use((err, req, res, next) => {
    console.error(err.stack)
    const message = isProduction ? "Serverfel." : `Serverfel: ${err.message}`
    res.status(500).send(message)
})

export { app, port }