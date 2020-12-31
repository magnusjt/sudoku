import { Board, Technique } from '../types'
import {
    allCandidates,
    allResults,
    difference,
    first,
    getAffectedPoints,
    getAffectedPointsInCommon,
    getAllUnfilledPoints,
    getBoardCell,
    getPointsWithCandidates,
    getPointsWithNCandidates,
    removeCandidateFromPoints
} from '../utils'

function *xyWingGenerator(board: Board){
    const biValuePoints = getPointsWithNCandidates(board, getAllUnfilledPoints(board), 2)

    for(let pivot of biValuePoints){
        const affectedBiValuesPoints = getPointsWithNCandidates(board, getAffectedPoints(pivot), 2)
        const xy = getBoardCell(board, pivot).candidates
        const [x, y] = xy
        const zValues = difference(allCandidates, xy, (a, b) => a === b)
        for(let z of zValues){
            const pincer1 = getPointsWithCandidates(board, affectedBiValuesPoints, [z, x])[0]
            if(!pincer1) continue

            const pincer2 = getPointsWithCandidates(board, affectedBiValuesPoints, [z, y])[0]
            if(!pincer2) continue

            const pointsToRemove = getAffectedPointsInCommon([pincer1, pincer2])
            const effects = removeCandidateFromPoints(board, pointsToRemove, z)
            const actors = [{point: pivot}, {point: pincer1}, {point: pincer2}]

            if(effects.length > 0){
                yield {effects, actors}
            }
        }
    }
    return null
}

function *xyzWingGenerator(board: Board){
    const triValuePoints = getPointsWithNCandidates(board, getAllUnfilledPoints(board), 3)

    for(let pivot of triValuePoints){
        const affectedBiValuesPoints = getPointsWithNCandidates(board, getAffectedPoints(pivot), 2)
        const pivotCands = getBoardCell(board, pivot).candidates
        for(let z of pivotCands){
            const xy = difference(pivotCands, [z], (a, b) => a === b)
            const [x, y] = xy

            const pincer1 = getPointsWithCandidates(board, affectedBiValuesPoints, [z, x])[0]
            if(!pincer1) continue

            const pincer2 = getPointsWithCandidates(board, affectedBiValuesPoints, [z, y])[0]
            if(!pincer2) continue

            const pointsToRemove = getAffectedPointsInCommon([pivot, pincer1, pincer2])
            const effects = removeCandidateFromPoints(board, pointsToRemove, z)
            const actors = [{point: pivot}, {point: pincer1}, {point: pincer2}]

            if(effects.length > 0){
                yield {effects, actors}
            }
        }
    }
    return null
}

export const xyWing: Technique = (board: Board) => first(xyWingGenerator(board))
export const allXyWings: Technique = (board: Board) => allResults(xyWingGenerator(board))

export const xyzWing: Technique = (board: Board) => first(xyzWingGenerator(board))
export const allXyzWings: Technique = (board: Board) => allResults(xyzWingGenerator(board))

// TODO: w-wing. Requires chains, which are a bit more complicated