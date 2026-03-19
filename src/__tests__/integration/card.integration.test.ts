import request from "supertest"
import app from "../../app"

let token: string
let boardId: string
let columnId: string
let columnId2: string
let cardId: string

beforeAll(async () => {
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "joseph@test.com", password: "password123" })

  token = loginRes.body.data.token

  const boardRes = await request(app)
    .post("/api/boards")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Card Integration Test Board" })

  boardId = boardRes.body.data.id

  const col1Res = await request(app)
    .post(`/api/boards/${boardId}/columns`)
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "To Do", position: 0 })

  columnId = col1Res.body.data.id

  const col2Res = await request(app)
    .post(`/api/boards/${boardId}/columns`)
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "In Progress", position: 1 })

  columnId2 = col2Res.body.data.id
}, 30000)

afterAll(async () => {
  await request(app)
    .delete(`/api/boards/${boardId}`)
    .set("Authorization", `Bearer ${token}`)
}, 30000)

describe("Move Card Flow", () => {
  it("should create a card in column 1", async () => {
    const res = await request(app)
      .post(`/api/columns/${columnId}/cards`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Integration Test Card" })

    expect(res.status).toBe(201)
    expect(res.body.data.title).toBe("Integration Test Card")
    expect(res.body.data.columnId).toBe(columnId)

    cardId = res.body.data.id
  }, 30000)

  it("should move card to column 2", async () => {
    const res = await request(app)
      .patch(`/api/columns/${columnId}/cards/${cardId}/move`)
      .set("Authorization", `Bearer ${token}`)
      .send({ targetColumnId: columnId2 })

    expect(res.status).toBe(200)
    expect(res.body.data.columnId).toBe(columnId2)
  }, 30000)

  it("should detect version conflict on update", async () => {
    await request(app)
      .put(`/api/columns/${columnId2}/cards/${cardId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "First Update", version: 0 })

    const res = await request(app)
      .put(`/api/columns/${columnId2}/cards/${cardId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Second Update", version: 0 })

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
  }, 30000)
})