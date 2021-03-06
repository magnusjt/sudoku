import {
    AddCandidatesEffect,
    Board,
    Effect,
    EliminationEffect, GroupEffect,
    NoneEffect,
    Point,
    RemoveValueEffect,
    SetValueEffect
} from '../types'
import { cloneBoard, getAffectedPoints, getBoardCell, pointsEqual } from './sudokuUtils'
import { arraysEqual, unique, uniqueBy } from './misc'

export const removeCandidates = (board: Board, point: Point, numbers: number[]): EliminationEffect | NoneEffect => {
    const cell = getBoardCell(board, point)
    const candidatesToRemove = cell.candidates.filter(x => numbers.includes(x))
    if(candidatesToRemove.length === 0 || cell.value !== null){
        return {type: 'none'} as NoneEffect
    }
    return {type: 'elimination', point, numbers: candidatesToRemove}
}

export const addCandidates = (board: Board, point: Point, numbers: number[]): AddCandidatesEffect | NoneEffect => {
    const cell = getBoardCell(board, point)
    const candidatesToAdd = numbers.filter(x => !cell.candidates.includes(x))
    if(candidatesToAdd.length === 0 || cell.value !== null){
        return {type: 'none'} as NoneEffect
    }
    return {type: 'addCandidates', point, numbers: candidatesToAdd}
}

export const effectsEqual = (eff1: Effect | GroupEffect, eff2: Effect | GroupEffect) => {
    if(eff1.type === 'value' && eff2.type === 'value'){
        return pointsEqual(eff1.point, eff2.point) && eff1.number === eff2.number
    }else if(eff1.type === 'elimination' && eff2.type === 'elimination'){
        return pointsEqual(eff1.point, eff2.point) && arraysEqual(eff1.numbers, eff2.numbers, (a, b) => a === b)
    }else if(eff1.type === 'group-elimination' && eff2.type === 'group-elimination'){
        return eff1.groupId === eff2.groupId && eff1.number === eff2.number
    }else if(eff1.type === 'group-value' && eff2.type === 'group-value'){
        return eff1.groupId === eff2.groupId && eff1.number === eff2.number
    }
    return false
}

export const uniqueEffects = <T extends Effect | GroupEffect>(effects: T[]) => uniqueBy(effects, effectsEqual)

export const removeCandidatesFromPoints = (board: Board, points: Point[], numbers: number[]): EliminationEffect[] => {
    const effects = points
        .map(point => removeCandidates(board, point, numbers))
        .filter(eff => eff.type !== 'none') as EliminationEffect[]

    return uniqueEffects(effects)
}

export const addCandidatesToPoints = (board: Board, points: Point[], numbers: number[]): AddCandidatesEffect[] => {
    return points
        .map(point => addCandidates(board, point, numbers))
        .filter(eff => eff.type !== 'none') as AddCandidatesEffect[]
}

export const removeCandidateFromPoints = (board: Board, points: Point[], number: number): EliminationEffect[] => {
    return removeCandidatesFromPoints(board, points, [number])
}

export const removeCandidateFromAffectedPoints = (board: Board, point: Point, number: number): EliminationEffect[] => {
    return removeCandidateFromPoints(board, getAffectedPoints(point), number)
}

export const toggleCandidate = (board: Board, points: Point[], digit: number): AddCandidatesEffect[] | EliminationEffect[] => {
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

export const toggleValue = (board: Board, point: Point, digit: number): (SetValueEffect | EliminationEffect)[] | RemoveValueEffect[] => {
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
