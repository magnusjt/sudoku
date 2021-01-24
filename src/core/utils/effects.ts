import { AddCandidatesEffect, Board, Effect, EliminationEffect, NoneEffect, Point } from '../types'
import { cloneBoard, getAffectedPoints, getBoardCell } from './sudokuUtils'
import { unique } from './misc'

export const removeCandidates = (board: Board, point: Point, numbers: number[]): Effect => {
    const cell = getBoardCell(board, point)
    const candidatesToRemove = cell.candidates.filter(x => numbers.includes(x))
    if(candidatesToRemove.length === 0 || cell.value !== null){
        return {type: 'none'} as NoneEffect
    }
    return {type: 'elimination', point, numbers: candidatesToRemove} as EliminationEffect
}

export const addCandidates = (board: Board, point: Point, numbers: number[]): Effect => {
    const cell = getBoardCell(board, point)
    const candidatesToAdd = numbers.filter(x => !cell.candidates.includes(x))
    if(candidatesToAdd.length === 0 || cell.value !== null){
        return {type: 'none'} as NoneEffect
    }
    return {type: 'addCandidates', point, numbers: candidatesToAdd} as AddCandidatesEffect
}

export const removeCandidatesFromPoints = (board: Board, points: Point[], numbers: number[]): Effect[] => {
    return points
        .map(point => removeCandidates(board, point, numbers))
        .filter(eff => eff.type !== 'none')
}

export const addCandidatesToPoints = (board: Board, points: Point[], numbers: number[]): Effect[] => {
    return points
        .map(point => addCandidates(board, point, numbers))
        .filter(eff => eff.type !== 'none')
}

export const removeCandidateFromPoints = (board: Board, points: Point[], number: number): Effect[] => {
    return removeCandidatesFromPoints(board, points, [number])
}

export const removeCandidateFromAffectedPoints = (board: Board, point: Point, number: number): Effect[] => {
    return removeCandidateFromPoints(board, getAffectedPoints(point), number)
}

export const toggleCandidate = (board: Board, points: Point[], digit: number): Effect[] => {
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

export const toggleValue = (board: Board, point: Point, digit: number): Effect[] => {
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

export const applyEffects = (board: Board, effects: Effect[]) => {
    board = cloneBoard(board)

    effects.forEach(effect => {
        if(effect.type === 'elimination') {
            board[effect.point.y][effect.point.x].candidates = board[effect.point.y][effect.point.x].candidates.filter(c => !effect.numbers.includes(c))
        }else if(effect.type === 'addCandidates'){
            board[effect.point.y][effect.point.x].candidates.push(...effect.numbers)
            board[effect.point.y][effect.point.x].candidates = unique(board[effect.point.y][effect.point.x].candidates)
        }else if(effect.type === 'value'){
            board[effect.point.y][effect.point.x].value = effect.number
            board[effect.point.y][effect.point.x].candidates = []
        }
    })

    return board
}
