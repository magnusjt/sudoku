import {
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

export const pointer = (board: Board) => {
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