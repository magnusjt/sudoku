import { Board, Technique } from '../types'
import {
    allResults,
    difference,
    first,
    getAllHousesMinusFilledPoints,
    getAllPoints,
    getBoardCell,
    pointsEqual,
    removeCandidateFromAffectedPoints
} from '../utils'

/**
 * There is only one candidate in a cell. Can be filled immediately.
 */
function *nakedSingleGenerator(board: Board){
    for(let point of getAllPoints()){
        const cell = getBoardCell(board, point)
        if(cell.candidates.length === 1){
            yield {
                actors: [{point}],
                effects: [
                    {type: 'value', point, number: cell.candidates[0]} as const,
                    ...removeCandidateFromAffectedPoints(board, point, cell.candidates[0])
                ]
            }
        }
    }
    return null
}

/**
 * The candidate is only in one position in the box, row, or column, and is hidden among other candidates
 * All naked singles must be eliminated first or else we find them as hidden singles
 */
function *hiddenSingleGenerator(board: Board){
    for(let points of getAllHousesMinusFilledPoints(board)){
        for(let cand = 1; cand <= 9; cand++){
            const pointsWithCand = points.filter(p => getBoardCell(board, p).candidates.some(c => c === cand))
            if(pointsWithCand.length === 1){
                const point = pointsWithCand[0]
                if(getBoardCell(board, point).candidates.length > 1){ // Otherwise it is naked
                    yield {
                        effects: [
                            {type: 'value', point, number: cand} as const,
                            ...removeCandidateFromAffectedPoints(board, point, cand)
                        ],
                        actors: difference(points, [point], pointsEqual).map(point => ({point}))
                    }
                }
            }
        }
    }
    return null
}

export const nakedSingle: Technique = (board: Board) => first(nakedSingleGenerator(board))
export const allNakedSingles: Technique = (board: Board) => allResults(nakedSingleGenerator(board))

export const hiddenSingle: Technique = (board: Board) => first(hiddenSingleGenerator(board))
export const allHiddenSingles: Technique = (board: Board) => allResults(hiddenSingleGenerator(board))