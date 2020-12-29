import { Board, Cell, Technique } from './types'
import {
    basicElimination,
    hiddenPair,
    hiddenSingle,
    hiddenTriple, inversePointer,
    nakedPair,
    nakedSingle, nakedTriple,
    pointer, skyscraper, uniqueRectangle,
    xWing
} from './techniques'
import { applyEffects, isBoardFinished } from './utils'

export const boardFromInput = (input: number[][]) => {
    const candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    let board: Board = []
    for(let y = 0; y < 9; y++){
        let row: Cell[] = []
        for(let x = 0; x < 9; x++){
            if(input[y][x] !== 0){
                row.push({
                    value: input[y][x],
                    candidates: []
                })
            }else{
                row.push({
                    value: null,
                    candidates
                })
            }
        }
        board.push(row)
    }
    return board
}

const techniques: {type: string, fn: Technique}[] = [
    {type: 'basic', fn: basicElimination},
    {type: 'nakedSingle', fn: nakedSingle},
    {type: 'hiddenSingle', fn: hiddenSingle},
    {type: 'pointer', fn: pointer},
    {type: 'inversePointer', fn: inversePointer},
    {type: 'nakedPair', fn: nakedPair},
    {type: 'nakedTriple', fn: nakedTriple},
    {type: 'hiddenPair', fn: hiddenPair},
    {type: 'hiddenTriple', fn: hiddenTriple},
    {type: 'xWing', fn: xWing},
    {type: 'skyscraper', fn: skyscraper},
    {type: 'uniqueRectangle', fn: uniqueRectangle},
]

const runTechnique = (board) => {
    for(let technique of techniques){
        const result = technique.fn(board)
        if(result){
            return {
                ...result,
                technique: technique.type
            }
        }
    }

    return null
}

export const runBasicEliminations = (board) => {
    let res = basicElimination(board)
    while(res){
        board = applyEffects(board, res.effects)
        res = basicElimination(board)
    }

    return board
}

export const iterate = (board) => {
    const result = runTechnique(board)
    if(result){
        board = applyEffects(board, result.effects)
        return {board, ...result}
    }

    if(isBoardFinished(board)){
        return {board, effects: [], actors: [], technique: 'done'}
    }

    return {board, effects: [], actors: [], technique: 'wtf'}
}