import { allCandidates, canPutDigit, cloneBoard, getAllPoints } from './utils'
import { Board, Cell, Point } from './types'
import { hasUniqueSolution } from './utils/hasUniqueSolution'

const rand = (n: number) => Math.floor((Math.random()*n))
const randIndex = list => rand(list.length)

const randomOrder = (list) => {
    list = [...list]
    for(let i = 0; i < list.length; i++){
        const ri = randIndex(list)
        const tmp = list[i]
        list[i] = list[ri]
        list[ri] = tmp
    }
    return list
}

const getEmptyBoard = () => {
    const board: Board = []
    for(let y = 0; y < 9; y++){
        const row: Cell[] = []
        for(let x = 0; x < 9; x++){
            row.push({value: null, candidates: [], given: false})
        }
        board.push(row)
    }
    return board
}

export function *generateBoards(maxGivens = 40){
    const cands = randomOrder(allCandidates)
    const seedBoard = generateSeedBoard(getEmptyBoard(), cands, 0, 0)

    while(true){
        const points = randomOrder(getAllPoints())
        const {board, givens} = findSmallestUniqueBoard(seedBoard, points)
        if(givens < maxGivens){
            yield board
        }
    }
}

const generateSeedBoard = (board: Board, cands, x, y) => {
    if(x === 9){
        x = 0
        y++
        if(y === 9){
            return board
        }
    }
    board[y][x].given = true // Just set everything to given since we're gonna fill everything anyway

    for(let n of cands){
        if(canPutDigit(board, {x,y}, n)){
            board[y][x].value = n
            const solution = generateSeedBoard(board, cands, x+1,y)
            if(solution){
                return solution
            }
        }
    }

    board[y][x].value = null
    return null
}

const findSmallestUniqueBoard = (board: Board, pointsToRemove: Point[]): {board: Board, givens: number} => {
    board = cloneBoard(board)
    let i = 0
    while(i < pointsToRemove.length){
        const point = pointsToRemove[i]
        const value = board[point.y][point.x].value
        board[point.y][point.x].value = null
        board[point.y][point.x].given = false
        if(!hasUniqueSolution(board)){
            board[point.y][point.x].value = value
            board[point.y][point.x].given = true
            return {board, givens: 9*9-i+1}
        }
        i++
    }
    throw new Error('wtf')
}