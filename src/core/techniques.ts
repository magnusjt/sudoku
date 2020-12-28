import {
    candidatesEqual,
    difference,
    getAllClosedRegions,
    getAllPoints,
    getBoardCell, getColumn,
    getRow, pointsEqual,
    removeCandidateFromAffectedPoints, removeCandidateFromPoints, unique
} from './utils'
import { Board, Technique } from './types'

export const basicElimination: Technique = (board: Board) => {
    for(let point of getAllPoints()){
        const cell = getBoardCell(board, point)
        if(cell.value === null){
            continue
        }

        const effects = removeCandidateFromAffectedPoints(board, point, cell.value)
        if(effects.length > 0){
            return {
                actors: [{point}],
                effects
            }
        }
    }
    return null
}

export const nakedSingle: Technique = (board: Board) => {
    for(let point of getAllPoints()){
        const cell = getBoardCell(board, point)
        if(cell.candidates.length === 1){
            return {
                actors: [{point}],
                effects: [{type: 'value', point, number: cell.candidates[0]}]
            }
        }
    }
    return null
}

export const hiddenSingle: Technique = (board: Board) => {
    for(let points of getAllClosedRegions()){
        for(let n = 1; n <= 9; n++){
            const pointsWithN = points.filter(p => getBoardCell(board, p).candidates.some(c => c === n))
            if(pointsWithN.length === 1){
                const point = pointsWithN[0]
                const removedCandidates = getBoardCell(board, point).candidates.filter(c => c !== n)
                if(removedCandidates.length > 0){
                    return {
                        effects: [{type: 'elimination', point, numbers: removedCandidates}],
                        actors: points.filter(p => !pointsEqual(p, point)).map(point => ({point}))
                    }
                }
            }
        }
    }
    return null
}

export const pointer: Technique = (board: Board) => {
    for(let points of getAllClosedRegions()){
        for(let n = 1; n <= 9; n++){
            const pointsWithN = points.filter(p => getBoardCell(board, p).candidates.some(c => c === n))
            if(pointsWithN.length === 1){
                // If it's only one, it's just a hidden single
                continue
            }

            let pointsToRemove = []
            if(unique(pointsWithN.map(p => p.x)).length === 1){
                pointsToRemove = difference(getColumn(pointsWithN[0].x), pointsWithN, pointsEqual)
            }
            if(unique(pointsWithN.map(p => p.y)).length === 1){
                pointsToRemove = difference(getRow(pointsWithN[0].y), pointsWithN, pointsEqual)
            }
            const effects = removeCandidateFromPoints(board, pointsToRemove, n)
            if(effects.length > 0){
                const actors = pointsWithN.map(point => ({point}))
                return {
                    actors,
                    effects
                }
            }
        }
    }
    return null
}

export const nakedPair: Technique = (board: Board) => {
    for(let points of getAllClosedRegions()){
        const pointsWith2Cands = points.filter(p => getBoardCell(board, p).candidates.length === 2)

        for(let i = 0; i < pointsWith2Cands.length; i++){
            for(let j = i+1; j < pointsWith2Cands.length; j++){
                const pointA = pointsWith2Cands[i]
                const pointB = pointsWith2Cands[j]
                const candidatesA = getBoardCell(board, pointA).candidates
                const candidatesB = getBoardCell(board, pointB).candidates
                if(candidatesEqual(candidatesA, candidatesB)){
                    const pointsToRemove = points.filter(p => !pointsEqual(p, pointA) && !pointsEqual(p, pointB))
                    const effects = [
                        ...removeCandidateFromPoints(board, pointsToRemove, candidatesA[0]),
                        ...removeCandidateFromPoints(board, pointsToRemove, candidatesA[1])
                    ]

                    if(effects.length > 0){
                        return {
                            effects,
                            actors: [{point: pointA}, {point: pointB}]
                        }
                    }
                }
            }
        }

    }
    return null
}

export const hiddenPair: Technique = (board: Board) => {
    return null
}

export const nakedTriple: Technique = (board: Board) => {
    return null
}

export const hiddenTriple: Technique = (board: Board) => {
    return null
}

export const xWing: Technique = (board: Board) => {

    return null
}