import { allCandidates, canPutDigit, cloneBoard, getAllPoints, getPointId } from './utils/sudokuUtils'
import { Board, Cell, Point } from './types'
import { hasUniqueSolution } from './utils/hasUniqueSolution'
import { rand, randomOrder } from './utils/misc'
import { createPatterns } from './utils/patterns'

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

export function *generateRandomBoards(usePattern, seedBoardRefresh = 10){
    let seedBoard = generateSeedBoard(getEmptyBoard(), randomOrder(allCandidates), 0, 0)
    let n = 0

    while(true){
        const patterns = createPatterns()
        const points = usePattern
            ? patterns[rand(patterns.length)]
            : randomOrder(getAllPoints())

        yield findSmallestUniqueBoard(seedBoard, points)

        if(n%seedBoardRefresh === 0){
            seedBoard = generateSeedBoard(getEmptyBoard(), randomOrder(allCandidates), 0, 0)
        }
        n++
    }
}

export function *generateBoardsWithMaxGivens(maxGivens: number, randomGivens: boolean, usePattern: boolean): Generator<Board>{
    for(let {board, givens} of generateRandomBoards(usePattern)){
        if(randomGivens){
            maxGivens = 30 + rand(20)
        }
        if(givens <= maxGivens){
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
        if(canPutDigit(board, {x,y, id: getPointId(x, y)}, n)){
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
        const {x, y} = pointsToRemove[i]
        const value = board[y][x].value
        board[y][x].value = null
        board[y][x].given = false
        if(!hasUniqueSolution(board)){
            board[y][x].value = value
            board[y][x].given = true
            return {board, givens: 9*9-i+1}
        }
        i++
    }
    throw new Error('wtf')
}