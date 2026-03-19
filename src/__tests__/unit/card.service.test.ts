import cardService from "../../modules/card/card.service"
import cardRepository from "../../modules/card/card.repository"
import columnRepository from "../../modules/column/column.repository"
import boardRepository from "../../modules/board/board.repository"
import { CreateCardInput, UpdateCardInput } from "../../modules/card/card.validator"

jest.mock("../../modules/card/card.repository")
jest.mock("../../modules/column/column.repository")
jest.mock("../../modules/board/board.repository")
jest.mock("../../lib/socket", () => ({
  getIO: () => ({
    to: () => ({ emit: jest.fn() }),
  }),
}))

const mockCardRepository = cardRepository as jest.Mocked<typeof cardRepository>
const mockColumnRepository = columnRepository as jest.Mocked<typeof columnRepository>
const mockBoardRepository = boardRepository as jest.Mocked<typeof boardRepository>

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

describe("Card Service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("createCard", () => {
    it("should create a card successfully", async () => {
      mockColumnRepository.findById.mockResolvedValue(mockColumn)
      mockBoardRepository.findById.mockResolvedValue(mockBoard)
      mockCardRepository.getMaxPosition.mockResolvedValue(0)
      mockCardRepository.create.mockResolvedValue(mockCard)

      const result = await cardService.createCard("user-uuid", "column-uuid", {
        title: "Test Card",
      })

      expect(mockCardRepository.create).toHaveBeenCalledWith("column-uuid", { title: "Test Card" }, 1)
      expect(result).toEqual(mockCard)
    })

    it("should throw 404 if column not found", async () => {
      mockColumnRepository.findById.mockResolvedValue(null)

      await expect(
        cardService.createCard("user-uuid", "column-uuid", { title: "Test Card" })
      ).rejects.toMatchObject({ statusCode: 404 })
    })

    it("should throw 403 if user does not own the board", async () => {
      mockColumnRepository.findById.mockResolvedValue(mockColumn)
      mockBoardRepository.findById.mockResolvedValue({ ...mockBoard, userId: "other-user" })

      await expect(
        cardService.createCard("user-uuid", "column-uuid", { title: "Test Card" })
      ).rejects.toMatchObject({ statusCode: 403 })
    })
  })

  describe("updateCard — conflict detection", () => {
    it("should update card when version matches", async () => {
      const updatedCard = { ...mockCard, title: "Updated", version: 1 }

      mockCardRepository.findById.mockResolvedValue(mockCard)
      mockColumnRepository.findById.mockResolvedValue(mockColumn)
      mockBoardRepository.findById.mockResolvedValue(mockBoard)
      mockCardRepository.update.mockResolvedValue(updatedCard)

      const result = await cardService.updateCard("user-uuid", "card-uuid", {
        title: "Updated",
        version: 0,
      })

      expect(result).toEqual(updatedCard)
    })

    it("should throw 409 when version does not match", async () => {
      mockCardRepository.findById.mockResolvedValue({ ...mockCard, version: 2 })
      mockColumnRepository.findById.mockResolvedValue(mockColumn)
      mockBoardRepository.findById.mockResolvedValue(mockBoard)

      await expect(
        cardService.updateCard("user-uuid", "card-uuid", {
          title: "Updated",
          version: 0,
        })
      ).rejects.toMatchObject({ statusCode: 409 })
    })

    it("should throw 404 if card not found", async () => {
      mockCardRepository.findById.mockResolvedValue(null)

      await expect(
        cardService.updateCard("user-uuid", "card-uuid", { title: "Updated", version: 0 })
      ).rejects.toMatchObject({ statusCode: 404 })
    })
  })
})