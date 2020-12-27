import { Board, Field } from './types'
import { basicElimination, hiddenSingle, nakedSingle } from './techniques'
import { isBoardFinished, setAllSingleCandidates } from './utils'

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

const techniques = [
    {type: 'setValues', fn: setAllSingleCandidates},
    {type: 'basic', fn: basicElimination},
    {type: 'nakedSingle', fn: nakedSingle},
    {type: 'hiddenSingle', fn: hiddenSingle},
]

const runTechnique = (board) => {
    for(let technique of techniques){
        const result = technique.fn(board)
        if(result.effects.length > 0){
            return {
                ...result,
                technique: technique.type
            }
        }
    }

    return {
        board,
        effects: [],
        actors: [],
        technique: 'none'
    }
}

export const runBasicEliminations = (board) => {
    let res = basicElimination(board)
    board = res.board

    while(res.effects.length > 0){
        res = basicElimination(board)
        board = res.board
    }

    return board
}

export const iterate = (board) => {
    const result = runTechnique(board)
    if(result.effects.length > 0){
        return result
    }

    if(isBoardFinished(board)){
        return {board, effects: [], actors: [], technique: 'done'}
    }

    return {board, effects: [], actors: [], technique: 'wtf'}
}