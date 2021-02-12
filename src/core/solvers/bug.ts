import { SolverBoard } from '../types'
import { removeCandidateFromAffectedPoints } from '../utils/effects'
import { allResults, first  } from '../utils/misc'
import {
    allCandidates, cloneBoard, getAllHousesMinusFilledPoints,
    getAllUnfilledPoints,
    getBoardCell, getPointsWithCandidates,
    getPointsWithNCandidates
} from '../utils/sudokuUtils'

/**
 * A BUG (binary universal grave) occurs when all cells have two candidates,
 * and all candidates appear twice in the houses it's in.
 * In case of a BUG, there cannot be a unique solution to the puzzle.
 */
const hasBug = (board: SolverBoard) => {
    const allCellsHaveTwoCands = getAllUnfilledPoints(board).every(point => getBoardCell(board, point).candidates.length === 2)
    if(!allCellsHaveTwoCands) return false

    for(let cand of allCandidates){
        for(let house of getAllHousesMinusFilledPoints(board)){
            const occurrences = getPointsWithCandidates(board, house, [cand]).length
            if(occurrences !== 2 && occurrences !== 0) return false
        }
    }
    return true
}

/**
 * A BUG+1 is when there is a BUG plus one extra candidate in one cell.
 * This candidate must be placed to avoid the BUG.
 */
function *bugPlus1Generator(board: SolverBoard){
    const unfilled = getAllUnfilledPoints(board)
    const triValuePoints = getPointsWithNCandidates(board, unfilled, 3)

    if(triValuePoints.length !== 1) return null

    const biValuePoints = getPointsWithNCandidates(board, unfilled, 2)

    if(triValuePoints.length + biValuePoints.length !== unfilled.length) return null

    const triValuePoint = triValuePoints[0]
    const triValueCell = getBoardCell(board, triValuePoints[0])

    const clonedBoard = cloneBoard(board)

    for(let extraCand of triValueCell.candidates){
        // Temporarily remove the cand to check if there is a bug left
        clonedBoard[triValuePoint.y][triValuePoint.x].candidates = clonedBoard[triValuePoint.y][triValuePoint.x].candidates.filter(c => c !== extraCand)
        const bug = hasBug(clonedBoard)
        clonedBoard[triValuePoint.y][triValuePoint.x].candidates.push(extraCand)

        if(bug){
            yield {
                actors: biValuePoints.map(point => ({point})),
                effects: [
                    {type: 'value', point: triValuePoint, number: extraCand} as const,
                    ...removeCandidateFromAffectedPoints(board, triValuePoint, extraCand)
                ]
            }
        }
    }

    return null
}

export const bugPlus1 = (board: SolverBoard) => first(bugPlus1Generator(board))
export const allBugPlus1 = (board: SolverBoard) => allResults(bugPlus1Generator(board))