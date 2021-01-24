import { boardFromInput, prepareBoardForSolver } from '../core/sudoku'

export const createTestBoard = (input) => {
    const board = boardFromInput(input)
    return prepareBoardForSolver(board)
}