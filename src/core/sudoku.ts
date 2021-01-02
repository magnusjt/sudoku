import { Board, Cell, Effect, InputMode, Point } from './types'
import {
    addCandidatesToPoints,
    allCandidates,
    applyEffects,
    cloneBoard,
    getAllPoints,
    getBoardCell,
    removeCandidateFromAffectedPoints,
    removeCandidatesFromPoints
} from './utils'
import * as solve from './solve'

export const boardFromInput = (input: number[][], withCandidates = true) => {
    const candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    let board: Board = []
    for(let y = 0; y < 9; y++){
        let row: Cell[] = []
        for(let x = 0; x < 9; x++){
            if(input[y][x] !== 0){
                row.push({
                    value: input[y][x],
                    given: true,
                    candidates: []
                })
            }else{
                row.push({
                    value: null,
                    given: false,
                    candidates: withCandidates ? candidates : []
                })
            }
        }
        board.push(row)
    }
    return board
}

export const resetCandidates = (board: Board) => {
    board = cloneBoard(board)
    for(let point of getAllPoints()){
        board[point.y][point.x].candidates = board[point.y][point.x].value === null ? allCandidates : []
    }
    return board
}

const toggleCandidate = (board: Board, points: Point[], digit: number) => {
    const addCand = !points.every(p => {
        const cell = getBoardCell(board, p)
        return cell.value !== null || cell.candidates.includes(digit)
    })

    if(addCand){
        return addCandidatesToPoints(board, points, [digit])
    }else{
        return removeCandidatesFromPoints(board, points, [digit])
    }
}
const toggleValue = (board: Board, point: Point, digit: number): Effect[] => {
    const cell = getBoardCell(board, point)
    if(cell.given){
        return []
    }
    if(cell.value === digit){
        return [{type: 'value', point, number: null}]
    }else{
        return [
            {type: 'value', point, number: digit},
            ...removeCandidateFromAffectedPoints(board, point, digit)
        ]
    }
}

export const applyInputValue = (board: Board, points: Point[], digit: number, mode: InputMode): Board => {
    let effects: Effect[] = []
    if(points.length === 1){
        if(mode === 'candidates'){
            effects = toggleCandidate(board, points, digit)
        }else if(mode === 'value'){
            effects = toggleValue(board, points[0], digit)
        }
    }else if(points.length >= 2){
        effects = toggleCandidate(board, points, digit)
    }

    return applyEffects(board, effects)
}

export const prepareMessedUpBoardForSolver = (board: Board) => {
    board = resetCandidates(board)
    board = solve.applyBasicEliminations(board)
    return board
}

export const getTechniquesUntilNextValue = (board: Board) => {
    const techniques: string[] = []

    let res = solve.iterate(board)
    res !== null && techniques.push(res.technique)

    while(res !== null && !res.effects.some(eff => eff.type === 'value')){
        res = solve.iterate(res.board)
        res !== null && techniques.push(res.technique)
    }

    return techniques
}