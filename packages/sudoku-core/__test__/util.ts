import { boardFromInput, boardFromStr, prepareBoardForSolver } from '../src/sudoku'

export const createTestBoard = (input: number[][]) => {
    const board = boardFromInput(input)
    return prepareBoardForSolver(board)
}

export const createTestBoardFromStr = (input: string) => {
    const board = boardFromStr(input)
    return prepareBoardForSolver(board)
}