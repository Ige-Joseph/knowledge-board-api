import request from "supertest"
import app from "../../app"

let token: string
let boardId: string
let columnId: string
let cardId: string
let commentId: string

beforeAll(async () => {
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "joseph@test.com", password: "password123" })

  token = loginRes.body.data.token

  const boardRes = await request(app)
    .post("/api/boards")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Comment Integration Test Board" })

  boardId = boardRes.body.data.id

  const colRes = await request(app)
    .post(`/api/boards/${boardId}/columns`)
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "To Do", position: 0 })

  columnId = colRes.body.data.id

  const cardRes = await request(app)
    .post(`/api/columns/${columnId}/cards`)
    .set("Authorization", `Bearer ${token}`)
    .send({ title: "Comment Test Card" })

  cardId = cardRes.body.data.id
}, 30000)

afterAll(async () => {
  await request(app)
    .delete(`/api/boards/${boardId}`)
    .set("Authorization", `Bearer ${token}`)
}, 30000)

describe("Comment Flow", () => {
  it("should add a comment to a card", async () => {
    const res = await request(app)
      .post(`/api/cards/${cardId}/comments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "Integration test comment" })

    expect(res.status).toBe(201)
    expect(res.body.data.content).toBe("Integration test comment")
    expect(res.body.data.cardId).toBe(cardId)

    commentId = res.body.data.id
  }, 30000)

  it("should get comments with nested replies", async () => {
    // add a reply first
    await request(app)
      .post(`/api/cards/${cardId}/comments/${commentId}/replies`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "Integration test reply" })

    const res = await request(app)
      .get(`/api/cards/${cardId}/comments`)
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data[0]).toHaveProperty("replies")
    expect(res.body.data[0].replies.length).toBeGreaterThan(0)
  }, 30000)

  it("should not allow reply to a reply", async () => {
    const replyRes = await request(app)
      .post(`/api/cards/${cardId}/comments/${commentId}/replies`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "First reply" })

    const replyId = replyRes.body.data.id

    const res = await request(app)
      .post(`/api/cards/${cardId}/comments/${replyId}/replies`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "Nested reply attempt" })

    expect(res.status).toBe(400)
  }, 30000)
})