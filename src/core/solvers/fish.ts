import { Board, Point, Technique } from '../types'
import {
    difference,
    getAllPoints,
    getBoardCell,
    getColNumber,
    getColumn,
    getCombinations,
    getRow,
    getRowNumber,
    groupBy,
    pointsEqual,
    removeCandidateFromPoints
} from '../utils'

/**
 * Looks like 4 corners of a rectangle, where either the rows or cols are empty otherwise.
 * Two columns has the same candidate in only two rows. The rest of the rows can be eliminated
 * Two rows has the same candidate in only two cols. The rest of the columns can be eliminated.
 */
export const xWing: Technique = (board: Board) => {
    const getXWingResult = (xWingPoints: Point[], getLineNumber, getLine, cand) => {
        const lines = Object.values<Point[]>(groupBy(xWingPoints, getLineNumber)).filter(points => points.length === 2)
        if(lines.length !== 2) return null

        const pointsOnLines = lines.flatMap(points => getLine(getLineNumber(points[0])))
        const pointsToRemove = difference(pointsOnLines, xWingPoints, pointsEqual)
        const effects = removeCandidateFromPoints(board, pointsToRemove, cand)
        const actors = xWingPoints.map(point => ({point}))

        if(effects.length > 0){
            return {effects, actors}
        }
    }

    const allPoints = getAllPoints()
    for(let cand = 1; cand <= 9; cand++){
        const pointsWithN = allPoints.filter(p => getBoardCell(board, p).candidates.includes(cand))
        const colsWithTwo = Object.values<Point[]>(groupBy(pointsWithN, getColNumber)).filter(points => points.length === 2)
        const rowsWithTwo = Object.values<Point[]>(groupBy(pointsWithN, getRowNumber)).filter(points => points.length === 2)

        for(let [colA, colB] of getCombinations(colsWithTwo, 2)){
            const result = getXWingResult([...colA, ...colB], getRowNumber, getRow, cand)
            if(result) return result
        }

        for(let [rowA, rowB] of getCombinations(rowsWithTwo, 2)){
            const result = getXWingResult([...rowA, ...rowB], getColNumber, getColumn, cand)
            if(result) return result
        }
    }
    return null
}