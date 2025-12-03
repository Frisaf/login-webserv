import { app, port } from "./app.js"

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})