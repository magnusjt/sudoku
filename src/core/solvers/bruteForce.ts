import { SolverBoard, Technique, ValueEffect } from '../types'
import { canPutDigit, cloneBoard, getAllUnfilledPoints, getBoardCell } from '../utils/sudokuUtils'
import { allResults, first } from '../utils/misc'

function *generateBruteForceDigits(board: SolverBoard){
    const clonedBoard = cloneBoard(board)
    solve(clonedBoard)
    const unfilledPoints = getAllUnfilledPoints(board)
    for(let point of unfilledPoints){
        yield {
            effects: [{type: 'value', point, number: getBoardCell(clonedBoard, point).value} as ValueEffect],
            actors: [{point}]
        }
    }
}

const solve = (board: SolverBoard, x = 0, y = 0) => {
    if(x === 9){
        x = 0
        y++
        if(y === 9){
            return board // Got to the end of the board, solution found
        }
    }
    if(board[y][x].value !== null){
        return solve(board, x+1, y)
    }

    for(let n = 1; n <= 9; n++){
        if(canPutDigit(board, {x,y}, n)){
            board[y][x].value = n
            const solution = solve(board, x+1,y)
            if(solution){
                return solution
            }
        }
    }

    board[y][x].value = null
    return null
}

export const bruteForce: Technique = (board: SolverBoard) => first(generateBruteForceDigits(board))
export const allBruteForceDigits: Technique = (board: SolverBoard) => allResults(generateBruteForceDigits(board))