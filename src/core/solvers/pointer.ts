import { Board, Point, Technique } from '../types'
import {
    difference,
    getAllBoxes, getAllCols, getAllRows,
    getBoardCell, getBox, getBoxNumber,
    getColNumber,
    getColumn, getRow,
    getRowNumber,
    pointsEqual, removeCandidateFromPoints,
    unique
} from '../utils'

/**
 * If all of a certain candidate within a box are on the same col or row, the rest of the col or row can be eliminated
 */
export const pointer: Technique = (board: Board) => {
    for(let points of getAllBoxes()){
        for(let n = 1; n <= 9; n++){
            const pointsWithN = points.filter(p => getBoardCell(board, p).candidates.some(c => c === n))
            if(pointsWithN.length === 1){
                // If it's only one, it's just a hidden single
                continue
            }
            if(pointsWithN.length > 3){
                // Can't fit on a line in a box if more than 3
                continue
            }

            let pointsToRemove: Point[] = []
            if(unique(pointsWithN.map(getColNumber)).length === 1){
                pointsToRemove = difference(getColumn(pointsWithN[0].x), pointsWithN, pointsEqual)
            }
            if(unique(pointsWithN.map(getRowNumber)).length === 1){
                pointsToRemove = difference(getRow(pointsWithN[0].y), pointsWithN, pointsEqual)
            }
            const effects = removeCandidateFromPoints(board, pointsToRemove, n)
            const actors = pointsWithN.map(point => ({point}))

            if(effects.length > 0){
                return {effects, actors}
            }
        }
    }
    return null
}
/**
 * If all of a certain candidate within a row or col are in the same box, the rest of the box can be eliminated
 */
export const inversePointer: Technique = (board: Board) => {
    for(let points of [...getAllRows(), ...getAllCols()]){
        for(let n = 1; n <= 9; n++){
            const pointsWithN = points.filter(p => getBoardCell(board, p).candidates.some(c => c === n))
            if(pointsWithN.length === 1){
                // If it's only one, it's just a hidden single
                continue
            }
            if(pointsWithN.length > 3){
                // Can't fit in a box if it's more than 3
                continue
            }

            if(unique(pointsWithN.map(getBoxNumber)).length === 1){
                const pointsToRemove = difference(getBox(pointsWithN[0]), pointsWithN, pointsEqual)
                const effects = removeCandidateFromPoints(board, pointsToRemove, n)
                const actors = pointsWithN.map(point => ({point}))

                if(effects.length > 0){
                    return {effects, actors}
                }
            }
        }
    }
    return null
}