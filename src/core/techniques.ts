import {
    getAffectedPoints,
    getAllClosedRegions,
    getAllPoints,
    getBoardField,
    getRow,
    removeCandidate,
    removeCandidateFromAffectedPoints, setCandidates
} from './utils'
import { Board, Effect, Point } from './types'

export const basicElimination = (board: Board) => {
    for(let point of getAllPoints()){
        const field = getBoardField(board, point)
        if(field.value === null){
            continue
        }

        const result = removeCandidateFromAffectedPoints(board, point, field.value)
        if(result.effects.length > 0){
            const actors = [{point}]
            return {...result, actors}
        }
    }

    return {board, effects: [], actors: []}
}

export const nakedSingle = (board: Board) => {
    for(let points of getAllClosedRegions()){
        const point = points.find(point => getBoardField(board, point).candidates.length === 1)
        if(point){
            const result = removeCandidateFromAffectedPoints(board, point, getBoardField(board, point).candidates[0])
            if(result.effects.length > 0){
                const actors = [{point}]
                return {...result, actors}
            }
        }
    }
    return {board, effects: [], actors: []}
}

export const hiddenSingle = (board: Board) => {
    for(let points of getAllClosedRegions()){
        for(let n = 1; n <= 9; n++){
            const pointsWithN = points.filter(p => getBoardField(board, p).candidates.some(c => c === n))
            if(pointsWithN.length === 1){
                const point = pointsWithN[0]
                const result = removeCandidateFromAffectedPoints(board, point, n)
                board = result.board
                const effects = result.effects

                // Remove other candidates from the current point, as it was found to be a hidden single
                const removedCandidates = getBoardField(board, point).candidates.filter(c => c !== n)
                board = setCandidates(board, point, [n])
                if(removedCandidates.length > 0){
                    effects.push({type: 'elimination', point, numbers: removedCandidates})
                }

                const actors = [{point}]
                return {board, effects, actors}
            }
        }
    }
    return {board, effects: [], actors: []}
}