import boardService from "../../modules/board/board.service"
import boardRepository from "../../modules/board/board.repository"

// mock the repository
jest.mock("../../modules/board/board.repository")

const mockBoardRepository = boardRepository as jest.Mocked<typeof boardRepository>

describe("Board Service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("createBoard", () => {
    it("should create a board successfully", async () => {
      const mockBoard = {
        id: "board-uuid",
        name: "Test Board",
        userId: "user-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockBoardRepository.create.mockResolvedValue(mockBoard)

      const result = await boardService.createBoard("user-uuid", { name: "Test Board" })

      expect(mockBoardRepository.create).toHaveBeenCalledWith("user-uuid", { name: "Test Board" })
      expect(result).toEqual(mockBoard)
    })
  })

  describe("getUserBoards", () => {
    it("should return paginated boards for a user", async () => {
      const mockResult = {
        boards: [
          {
            id: "board-uuid",
            name: "Test Board",
            userId: "user-uuid",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }

      mockBoardRepository.findAllByUser.mockResolvedValue(mockResult)

      const result = await boardService.getUserBoards("user-uuid", 1, 10)

      expect(mockBoardRepository.findAllByUser).toHaveBeenCalledWith("user-uuid", 1, 10)
      expect(result).toEqual(mockResult)
    })
  })

  describe("updateBoard", () => {
    it("should throw 404 if board not found", async () => {
      mockBoardRepository.findById.mockResolvedValue(null)

      await expect(
        boardService.updateBoard("user-uuid", "board-uuid", { name: "Updated" })
      ).rejects.toMatchObject({ statusCode: 404 })
    })

    it("should throw 403 if user does not own the board", async () => {
      mockBoardRepository.findById.mockResolvedValue({
        id: "board-uuid",
        name: "Test Board",
        userId: "other-user-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await expect(
        boardService.updateBoard("user-uuid", "board-uuid", { name: "Updated" })
      ).rejects.toMatchObject({ statusCode: 403 })
    })

    it("should update board if user owns it", async () => {
      const mockBoard = {
        id: "board-uuid",
        name: "Test Board",
        userId: "user-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedBoard = { ...mockBoard, name: "Updated" }

      mockBoardRepository.findById.mockResolvedValue(mockBoard)
      mockBoardRepository.update.mockResolvedValue(updatedBoard)

      const result = await boardService.updateBoard("user-uuid", "board-uuid", { name: "Updated" })

      expect(result).toEqual(updatedBoard)
    })
  })
})