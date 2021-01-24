import { Board, Cell, Effect, InputMode, Point, SolverBoard } from './types'
import { allCandidates, cloneBoard, getAllPoints } from './utils/sudokuUtils'
import { applyEffects, toggleCandidate, toggleValue } from './utils/effects'
import * as solve from './solve'

export const boardFromInput = (input: number[][]) => {
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
                    candidates: []
                })
            }
        }
        board.push(row)
    }
    return board
}

export const boardFromStr = (input: string) => {
    return boardFromInput(
        [...input.matchAll(/\d{9}/g)]
            .map(x => x[0].split('').map(Number))
    )
}

export const resetCandidates = (board: Board): SolverBoard => {
    board = cloneBoard(board)
    for(let point of getAllPoints()){
        board[point.y][point.x].candidates = board[point.y][point.x].value === null ? allCandidates : []
    }
    return board as SolverBoard
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

export const prepareBoardForSolver = (board: Board): SolverBoard => {
    board = resetCandidates(board)
    board = solve.applyBasicEliminations(board)
    return board
}

/**
 * Iterates solver until the next digit can be placed.
 */
export const getTechniquesUntilNextValue = (board: Board) => {
    const techniques: string[] = []

    let res = solve.iterate(board)
    res !== null && techniques.push(res.technique)

    while(res !== null && res.technique !== 'done' && !res.effects.some(eff => eff.type === 'value')){
        res = solve.iterate(res.board)
        res !== null && techniques.push(res.technique)
    }

    return techniques
}