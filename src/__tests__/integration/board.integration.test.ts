import request from "supertest"
import app from "../../app"

let token: string
let boardId: string

beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "joseph@test.com", password: "password123" })
  token = res.body.data.token
}, 30000)

describe("Create Board Flow", () => {
  it("should create a board when authenticated", async () => {
    const res = await request(app)
      .post("/api/boards")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Integration Test Board" })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe("Integration Test Board")

    boardId = res.body.data.id
  }, 30000)

  it("should return 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/boards")
      .send({ name: "Test Board" })

    expect(res.status).toBe(401)
  }, 30000)

  it("should return 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/boards")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(400)
  }, 30000)

  it("should get boards with pagination", async () => {
    const res = await request(app)
      .get("/api/boards?page=1&limit=5")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("boards")
    expect(res.body.data).toHaveProperty("total")
    expect(res.body.data).toHaveProperty("totalPages")
  }, 30000)

  it("should delete the board after test", async () => {
    const res = await request(app)
      .delete(`/api/boards/${boardId}`)
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
  }, 30000)
})