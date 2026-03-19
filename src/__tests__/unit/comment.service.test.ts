import commentService from "../../modules/comment/comment.service"
import commentRepository from "../../modules/comment/comment.repository"
import cardRepository from "../../modules/card/card.repository"
import columnRepository from "../../modules/column/column.repository"
import boardRepository from "../../modules/board/board.repository"

jest.mock("../../modules/comment/comment.repository")
jest.mock("../../modules/card/card.repository")
jest.mock("../../modules/column/column.repository")
jest.mock("../../modules/board/board.repository")
jest.mock("../../lib/socket", () => ({
  getIO: () => ({
    to: () => ({ emit: jest.fn() }),
  }),
}))

const mockCommentRepository = commentRepository as jest.Mocked<typeof commentRepository>
const mockCardRepository = cardRepository as jest.Mocked<typeof cardRepository>
const mockColumnRepository = columnRepository as jest.Mocked<typeof columnRepository>
const mockBoardRepository = boardRepository as jest.Mocked<typeof boardRepository>

const mockCard = {
  id: "card-uuid",
  title: "Test Card",
  description: null,
  dueDate: null,
  position: 0,
  version: 0,
  columnId: "column-uuid",
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [],
}

const mockColumn = {
  id: "column-uuid",
  name: "To Do",
  position: 0,
  boardId: "board-uuid",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockBoard = {
  id: "board-uuid",
  name: "Test Board",
  userId: "user-uuid",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockComment = {
  id: "comment-uuid",
  content: "Test comment",
  cardId: "card-uuid",
  userId: "user-uuid",
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { id: "user-uuid", name: "Joseph", email: "joseph@test.com" },
}

describe("Comment Service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("createComment", () => {
    it("should create a comment successfully", async () => {
      mockCardRepository.findById.mockResolvedValue(mockCard)
      mockColumnRepository.findById.mockResolvedValue(mockColumn)
      mockBoardRepository.findById.mockResolvedValue(mockBoard)
      mockCommentRepository.create.mockResolvedValue(mockComment)

      const result = await commentService.createComment("user-uuid", "card-uuid", {
        content: "Test comment",
      })

      expect(mockCommentRepository.create).toHaveBeenCalledWith("card-uuid", "user-uuid", {
        content: "Test comment",
      })
      expect(result).toEqual(mockComment)
    })

    it("should throw 404 if card not found", async () => {
      mockCardRepository.findById.mockResolvedValue(null)

      await expect(
        commentService.createComment("user-uuid", "card-uuid", { content: "Test" })
      ).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe("createReply", () => {
    it("should create a reply successfully", async () => {
      const mockReply = { ...mockComment, id: "reply-uuid", parentId: "comment-uuid" }

      mockCardRepository.findById.mockResolvedValue(mockCard)
      mockColumnRepository.findById.mockResolvedValue(mockColumn)
      mockBoardRepository.findById.mockResolvedValue(mockBoard)
      mockCommentRepository.findById.mockResolvedValue(mockComment)
      mockCommentRepository.createReply.mockResolvedValue(mockReply)

      const result = await commentService.createReply(
        "user-uuid",
        "card-uuid",
        "comment-uuid",
        "This is a reply"
      )

      expect(result).toEqual(mockReply)
    })

    it("should throw 400 if replying to a reply", async () => {
      const nestedReply = { ...mockComment, parentId: "another-comment-uuid" }

      mockCardRepository.findById.mockResolvedValue(mockCard)
      mockColumnRepository.findById.mockResolvedValue(mockColumn)
      mockBoardRepository.findById.mockResolvedValue(mockBoard)
      mockCommentRepository.findById.mockResolvedValue(nestedReply)

      await expect(
        commentService.createReply("user-uuid", "card-uuid", "comment-uuid", "Nested reply")
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("should throw 404 if parent comment not found", async () => {
      mockCardRepository.findById.mockResolvedValue(mockCard)
      mockColumnRepository.findById.mockResolvedValue(mockColumn)
      mockBoardRepository.findById.mockResolvedValue(mockBoard)
      mockCommentRepository.findById.mockResolvedValue(null)

      await expect(
        commentService.createReply("user-uuid", "card-uuid", "comment-uuid", "Reply")
      ).rejects.toMatchObject({ statusCode: 404 })
    })
  })
})