import { Board } from '../types'
import { canPutDigit, cloneBoard, getPointId } from './sudokuUtils'

export const hasUniqueSolution = (board: Board) => {
    board = cloneBoard(board)
    const count = getSolutionCount(board)
    return count === 1
}

const getSolutionCount = (board: Board, x = 0, y = 0) => {
    if(x === 9){
        x = 0
        y++
        if(y === 9){
            return 1 // Got to the end of the board, solution found
        }
    }
    if(board[y][x].value !== null){
        return getSolutionCount(board, x+1, y)
    }

    let count = 0
    for(let n = 1; n <= 9; n++){
        if(canPutDigit(board, {x, y, id: getPointId(x, y)}, n)){
            board[y][x].value = n
            count += getSolutionCount(board, x+1,y)
            if(count >= 2){
                break
            }
        }
    }

    board[y][x].value = null
    return count
}