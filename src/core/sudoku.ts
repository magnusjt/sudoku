import { Board, Field, Technique } from './types'
import { basicElimination, hiddenSingle, nakedPair, nakedSingle, pointer } from './techniques'
import { applyEffects, isBoardFinished } from './utils'

export const boardFromInput = (input: number[][]) => {
    const candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    let board: Board = []
    for(let y = 0; y < 9; y++){
        let row: Field[] = []
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
    {type: 'nakedPair', fn: nakedPair},
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