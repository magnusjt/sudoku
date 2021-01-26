import { Board } from '../types'
import { getOverallDifficulty, getTechniquesRequiredForSolvingBoard } from '../solve'
import { prepareBoardForSolver } from '../sudoku'

export type BoardMetaData = {
    techniques: string[]
    difficulty: {
        level: number
        difficulty: string
    }
    givens: number
    boardData: string
}

export const getBoardMetaData = (board: Board): BoardMetaData => {
    board = prepareBoardForSolver(board)
    const techniques = getTechniquesRequiredForSolvingBoard(board)
    const difficulty = getOverallDifficulty(techniques)
    let givens = 0
    let boardData = ''
    for(let y = 0; y < 9; y++){
        for(let x = 0; x < 9; x++){
            const cell = board[y][x]
            boardData += cell.value === null ? '0' : String(cell.value)
            if(cell.given){
                givens++
            }
        }
    }
    return {
        techniques,
        difficulty,
        givens,
        boardData
    }
}