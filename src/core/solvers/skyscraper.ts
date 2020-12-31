import { Board, Point, Technique } from '../types'
import {
    difference,
    getAffectedPoints,
    getAllPoints, getAllUnfilledPoints,
    getBoardCell,
    getColNumber,
    getCombinations,
    getRowNumber,
    groupBy,
    intersectionOfAll,
    pointsEqual,
    removeCandidateFromPoints
} from '../utils'

const getAffectedPointsInCommon = (points: Point[]): Point[] => {
    return intersectionOfAll(points.map(getAffectedPoints), pointsEqual)
}

/**
 * Basically an x-wing where one candidate is not aligned.
 * The line (row or col) where the points are aligned force the candidate to be placed in one of the other two points.
 * All other cells that sees these two candidates can be eliminated.
 */
export const skyscraper: Technique = (board: Board) => {
    const getSkyscraperResult = (skyscraperPoints: Point[], getLineNumber, cand: number) => {
        const pointsOnLine = Object.values<Point[]>(
            groupBy(skyscraperPoints, getLineNumber)
        ).filter(points => points.length === 2)[0]

        if(!pointsOnLine) return null

        const pointsToCheck = difference(skyscraperPoints, pointsOnLine, pointsEqual)
        const affectedInCommon = getAffectedPointsInCommon(pointsToCheck)
        const pointsToRemove = difference(affectedInCommon, skyscraperPoints, pointsEqual)

        const effects = removeCandidateFromPoints(board, pointsToRemove, cand)
        const actors = skyscraperPoints.map(point => ({point}))

        if(effects.length > 0){
            return {effects, actors}
        }
        return null
    }

    const allPoints = getAllUnfilledPoints(board)
    for(let cand = 1; cand <= 9; cand++){
        const pointsWithN = allPoints.filter(p => getBoardCell(board, p).candidates.includes(cand))
        const colsWithTwo = Object.values<Point[]>(groupBy(pointsWithN, getColNumber)).filter(points => points.length === 2)
        const rowsWithTwo = Object.values<Point[]>(groupBy(pointsWithN, getRowNumber)).filter(points => points.length === 2)

        for(let [colA, colB] of getCombinations(colsWithTwo, 2)){
            const result = getSkyscraperResult([...colA, ...colB], getRowNumber, cand)
            if(result) return result
        }

        for(let [rowA, rowB] of getCombinations(rowsWithTwo, 2)){
            const result = getSkyscraperResult([...rowA, ...rowB], getColNumber, cand)
            if(result) return result
        }
    }
    return null
}
