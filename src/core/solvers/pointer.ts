import { Board, Point, Technique } from '../types'
import {
    allResults,
    difference,
    first,
    getAllBoxes,
    getAllCols,
    getAllRows,
    getBox,
    getBoxNumber,
    getColNumber,
    getColumn,
    getPointsWithCandidates,
    getRow,
    getRowNumber,
    pointsEqual,
    removeCandidateFromPoints,
    unique
} from '../utils'

/**
 * If all of a certain candidate within a box are on the same col or row, the rest of the col or row can be eliminated
 */
function *pointerGenerator(board: Board){
    for(let points of getAllBoxes()){
        for(let cand = 1; cand <= 9; cand++){
            const pointsWithCand = getPointsWithCandidates(board, points, [cand])
            if(pointsWithCand.length === 1) continue // If it's only one, it's just a hidden single
            if(pointsWithCand.length > 3) continue // Can't fit on a line in a box if more than 3

            let pointsToRemove: Point[] = []
            if(unique(pointsWithCand.map(getColNumber)).length === 1){
                pointsToRemove = difference(getColumn(pointsWithCand[0].x), pointsWithCand, pointsEqual)
            }else if(unique(pointsWithCand.map(getRowNumber)).length === 1){
                pointsToRemove = difference(getRow(pointsWithCand[0].y), pointsWithCand, pointsEqual)
            }
            const effects = removeCandidateFromPoints(board, pointsToRemove, cand)
            const actors = pointsWithCand.map(point => ({point}))

            if(effects.length > 0){
                yield {effects, actors}
            }
        }
    }
    return null
}

/**
 * If all of a certain candidate within a row or col are in the same box, the rest of the box can be eliminated
 */
function *inversePointerGenerator(board: Board){
    for(let points of [...getAllRows(), ...getAllCols()]){
        for(let cand = 1; cand <= 9; cand++){
            const pointsWithCand = getPointsWithCandidates(board, points, [cand])
            if(pointsWithCand.length === 1) continue // If it's only one, it's just a hidden single
            if(pointsWithCand.length > 3) continue // Can't fit in a box if it's more than 3

            if(unique(pointsWithCand.map(getBoxNumber)).length === 1){
                const pointsToRemove = difference(getBox(pointsWithCand[0]), pointsWithCand, pointsEqual)
                const effects = removeCandidateFromPoints(board, pointsToRemove, cand)
                const actors = pointsWithCand.map(point => ({point}))

                if(effects.length > 0){
                    yield {effects, actors}
                }
            }
        }
    }
    return null
}

export const pointer: Technique = (board: Board) => first(pointerGenerator(board))
export const allPointers: Technique = (board: Board) => allResults(pointerGenerator(board))

export const inversePointer: Technique = (board: Board) => first(inversePointerGenerator(board))
export const allInversePointers: Technique = (board: Board) => allResults(inversePointerGenerator(board))