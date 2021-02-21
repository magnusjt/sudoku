import { SolverBoard } from '../types'
import {
    allCandidates,
    getAffectedPoints, getAffectedPointsInCommon, getAllHousesMinusFilledPoints,
    getAllUnfilledPoints,
    getBoardCell, getPointsWithCandidates,
    getPointsWithNCandidates, pointsWhere
} from '../utils/sudokuUtils'
import { allResults, arraysEqual, difference, first } from '../utils/misc'
import { removeCandidateFromPoints } from '../utils/effects'

function *xyWingGenerator(board: SolverBoard){
    const biValuePoints = getPointsWithNCandidates(board, getAllUnfilledPoints(board), 2)

    for(const pivot of biValuePoints){
        const affectedBiValuesPoints = getPointsWithNCandidates(board, getAffectedPoints(pivot), 2)
        const xy = getBoardCell(board, pivot).candidates
        const [x, y] = xy
        const zValues = difference(allCandidates, xy, (a, b) => a === b)
        for(const z of zValues){
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

function *xyzWingGenerator(board: SolverBoard){
    const triValuePoints = getPointsWithNCandidates(board, getAllUnfilledPoints(board), 3)

    for(const pivot of triValuePoints){
        const affectedBiValuesPoints = getPointsWithNCandidates(board, getAffectedPoints(pivot), 2)
        const pivotCands = getBoardCell(board, pivot).candidates
        for(const z of pivotCands){
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

const candidatesEqual = (cands1, cands2) => arraysEqual(cands1, cands2, (a, b) => a === b)

function *wWingGenerator(board: SolverBoard){
    for(const x of allCandidates){
        for(const house of getAllHousesMinusFilledPoints(board)){
            const pointsWithX = getPointsWithCandidates(board, house, [x])
            if(pointsWithX.length === 2){
                const affected1 = getAffectedPoints(pointsWithX[0])
                const affected2 = getAffectedPoints(pointsWithX[1])
                for(const w of allCandidates){
                    const wx = [w, x]
                    const wxPoints1 = pointsWhere(board, affected1, cell => candidatesEqual(cell.candidates, wx))
                    const wxPoints2 = pointsWhere(board, affected2, cell => candidatesEqual(cell.candidates, wx))
                    for(let i = 0; i < wxPoints1.length; i++){
                        for(let j = 0; j < wxPoints2.length; j++){
                            const common = getAffectedPointsInCommon([wxPoints1[i], wxPoints2[j]])
                            const effects = removeCandidateFromPoints(board, common, w)
                            const actors = [
                                ...pointsWithX.map(point => ({ point, cand: x })),
                                ...wx.map(cand => ({ point: wxPoints1[i], cand })),
                                ...wx.map(cand => ({ point: wxPoints2[j], cand }))
                            ]
                            if(effects.length > 0){
                                yield {effects, actors}
                            }
                        }
                    }
                }
            }
        }
    }
    return null
}

export const xyWing = (board: SolverBoard) => first(xyWingGenerator(board))
export const allXyWings = (board: SolverBoard) => allResults(xyWingGenerator(board))

export const xyzWing = (board: SolverBoard) => first(xyzWingGenerator(board))
export const allXyzWings = (board: SolverBoard) => allResults(xyzWingGenerator(board))

export const wWing = (board: SolverBoard) => first(wWingGenerator(board))
export const allWWings = (board: SolverBoard) => allResults(wWingGenerator(board))