/**
 * Empty rectangles can be pretty simple:
 *
 * Pick one candidate
 * If you have a box with the candidate in only one row and one column, the cells not on that row and column is the "empty rectangle".
 * As usual, the weird naming in sudoku makes it harder to understand, so forget about the empty rectangle, and focus on the row and column instead.
 *
 * It comes down to this: If either the column or the row is eliminated, what remains is a pointer.
 * We can abuse this by looking for conjugate pairs (2 candidates in a house) where one cell of the pair sees the row or column in the box.
 * If the pair candidate is in this cell, we have a pointer
 * If the pair candidate is in the other cell, we can do basic eliminations
 * If the pointer and the basic elimination sees the same cell, the candidate can be removed from that cell
 *
 * NB: There is something called a dual rectangle where you can eliminate two points, but we can just run the algo twice and get the same result.
 */
import { SolverBoard, Point, Technique } from '../types'
import {
    allCandidates,
    getAllBoxes,
    getBoxNumber, getColNumber, getColsOutsideBox, getColumn,
    getPointsWithCandidates, getRowNumber,
    getRowsOutsideBox,
    pointsEqual
} from '../utils/sudokuUtils'
import { removeCandidateFromPoints } from '../utils/effects'
import { allResults, difference, first, groupBy, unique } from '../utils/misc'

function *emptyRectangleGenerator(board: SolverBoard){
    const getResult = (pairHouse: Point[], erPoints: Point[], pointerX, pointerY, cand) => {
        const pair = getPointsWithCandidates(board, pairHouse, [cand])
        if(pair.length !== 2) return null

        let pointToRemove
        if(pair.some(point => point.x === pointerX)){
            const otherPoint = pair.find(point => point.x !== pointerX)
            if(!otherPoint) return null
            pointToRemove = {x: otherPoint.x, y: pointerY}
        }else if(pair.some(point => point.y === pointerY)){
            const otherPoint = pair.find(point => point.y !== pointerY)
            if(!otherPoint) return null
            pointToRemove = {x: pointerX, y: otherPoint.y}
        }else{
            return null
        }

        // If both points are directly below/above (left/right) the box, it will try to eliminate a point inside the box, which is not valid
        if(erPoints.some(p => pointsEqual(p, pointToRemove))) return null

        const effects = removeCandidateFromPoints(board, [pointToRemove], cand)
        const actors = [...erPoints, ...pair].map(point => ({point}))
        if(effects.length > 0){
            return {effects, actors}
        }
        return null
    }

    for(let box of getAllBoxes()){
        for(let cand of allCandidates){
            const erPoints = getPointsWithCandidates(board, box, [cand])
            const boxNumber = getBoxNumber(box[0])
            const pairHouses = [...getRowsOutsideBox(boxNumber), ...getColsOutsideBox(boxNumber)]

            if(erPoints.length === 2 && erPoints[0].x !== erPoints[1].x && erPoints[0].y !== erPoints[1].y){
                // Only two points, diagonally. Still an ER, but with no clearly defined row and col. This means we have to try both.

                for(let pairHouse of pairHouses){
                    let result = getResult(pairHouse, erPoints, erPoints[0].x, erPoints[1].y, cand)
                    if(result) yield result

                    result = getResult(pairHouse, erPoints, erPoints[1].x, erPoints[0].y, cand)
                    if(result) yield result
                }
            }else{
                const colNumbers = unique(erPoints.map(p => p.x))
                let pointerLines: any = null
                for(let colNumber of colNumbers){
                    const wholeColumn = getColumn(colNumber)
                    const restPoints = difference(erPoints, wholeColumn, pointsEqual)
                    if(restPoints.length > 0 && restPoints.every(p => p.y === restPoints[0].y)){
                        pointerLines = {
                            x: colNumber,
                            y: restPoints[0].y
                        }
                    }
                }
                if(pointerLines !== null){
                    for(let pairHouse of pairHouses){
                        const result = getResult(pairHouse, erPoints, pointerLines.x, pointerLines.y, cand)
                        if(result) yield result
                    }
                }
            }
        }
    }
    return null
}

export const emptyRectangle: Technique = (board: SolverBoard) => first(emptyRectangleGenerator(board))
export const allEmptyRectangles: Technique = (board: SolverBoard) => allResults(emptyRectangleGenerator(board))