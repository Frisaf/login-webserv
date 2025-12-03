import request from "supertest"
import app from "../app"

describe("Server", () => {
    it("should respond to GET / with 200", async () => {
        const res = await request(app).get("/")
        expect(res.statusCode).toBe(200)
    })
    
        it("should respond with 404 for unknown route", async () => {
            const res = await request(app).get("/nonexistent-route")
            expect(res.statusCode).toBe(404)
            expect(res.text).toContain("Sidan kunde inte hittas.")
        })

        it("should respond with 500 for server error", async () => {
            const res = await request(app).get("/error")
            expect(res.statusCode).toBe(500)
            expect(res.text).toContain("Serverfel.")
        })
})

