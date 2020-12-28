import {
    difference, getAllBoxes,
    getAllClosedRegions, getAllCols,
    getAllPoints, getAllRows,
    getBoardCell, getBox, getBoxNumber, getColNumber, getColumn,
    getRow, getRowNumber, pointsEqual,
    removeCandidateFromAffectedPoints, removeCandidateFromPoints, unique, uniqueBy
} from './utils'
import { Board, Point, Technique } from './types'

/**
 * Just removes candidates from row, col, and box where the candidate is set as a value
 */
export const basicElimination: Technique = (board: Board) => {
    for(let point of getAllPoints()){
        const cell = getBoardCell(board, point)
        if(cell.value === null){
            continue
        }

        const effects = removeCandidateFromAffectedPoints(board, point, cell.value)
        if(effects.length > 0){
            return {
                actors: [{point}],
                effects
            }
        }
    }
    return null
}

/**
 * There is only one candidate in a given cell
 */
export const nakedSingle: Technique = (board: Board) => {
    for(let point of getAllPoints()){
        const cell = getBoardCell(board, point)
        if(cell.candidates.length === 1){
            return {
                actors: [{point}],
                effects: [{type: 'value', point, number: cell.candidates[0]}]
            }
        }
    }
    return null
}

/**
 * The candidate is only in one position in the box, row, or column, and is hidden among other candidates
 * All naked singles must be eliminated first or else we find them as hidden singles
 */
export const hiddenSingle: Technique = (board: Board) => {
    for(let points of getAllClosedRegions()){
        for(let n = 1; n <= 9; n++){
            const pointsWithN = points.filter(p => getBoardCell(board, p).candidates.some(c => c === n))
            if(pointsWithN.length === 1){
                const point = pointsWithN[0]
                const removedCandidates = getBoardCell(board, point).candidates.filter(c => c !== n)
                if(removedCandidates.length > 0){
                    return {
                        effects: [{type: 'elimination', point, numbers: removedCandidates}],
                        actors: points.filter(p => !pointsEqual(p, point)).map(point => ({point}))
                    }
                }
            }
        }
    }
    return null
}

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

            let pointsToRemove = []
            if(unique(pointsWithN.map(getColNumber)).length === 1){
                pointsToRemove = difference(getColumn(pointsWithN[0].x), pointsWithN, pointsEqual)
            }
            if(unique(pointsWithN.map(getRowNumber)).length === 1){
                pointsToRemove = difference(getRow(pointsWithN[0].y), pointsWithN, pointsEqual)
            }
            const effects = removeCandidateFromPoints(board, pointsToRemove, n)
            if(effects.length > 0){
                const actors = pointsWithN.map(point => ({point}))
                return {
                    actors,
                    effects
                }
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
                if(effects.length > 0){
                    const actors = pointsWithN.map(point => ({point}))
                    return {
                        actors,
                        effects
                    }
                }
            }
        }
    }
    return null
}

/**
 * In a given row, col, or box, there are two cells with only two candidates. These candidates can be eliminated from the rest of the region.
 */
export const nakedPair: Technique = (board: Board) => {
    for(let points of getAllClosedRegions()){
        const pointsWith2Cands = points.filter(p => getBoardCell(board, p).candidates.length === 2)

        for(let i = 0; i < pointsWith2Cands.length; i++){
            for(let j = i+1; j < pointsWith2Cands.length; j++){
                const pointA = pointsWith2Cands[i]
                const pointB = pointsWith2Cands[j]

                const candidatesA = getBoardCell(board, pointA).candidates
                const candidatesB = getBoardCell(board, pointB).candidates

                const allCandidates = unique([...candidatesA, ...candidatesB]) as number[]
                if(allCandidates.length !== 2) continue

                const pointsToRemove = points.filter(p => !pointsEqual(p, pointA) && !pointsEqual(p, pointB))
                const effects = allCandidates.flatMap(c => removeCandidateFromPoints(board, pointsToRemove, c))

                if(effects.length > 0){
                    return {
                        effects,
                        actors: [{point: pointA}, {point: pointB}]
                    }
                }
            }
        }
    }
    return null
}

/**
 * Same as naked pair, except this time the cells with the pair has other candidates in them. These other candidates can be eliminated.
 */
export const hiddenPair: Technique = (board: Board) => {
    for(let points of getAllClosedRegions()){
        for(let candA = 1; candA <= 9; candA++){
            for(let candB = candA+1; candB <= 9; candB++){
                const pointsWithA = points.filter(p => getBoardCell(board, p).candidates.includes(candA))
                if(pointsWithA.length !== 2) continue

                const pointsWithB = points.filter(p => getBoardCell(board, p).candidates.includes(candB))
                if(pointsWithB.length !== 2) continue

                const pointsWithAny = uniqueBy([...pointsWithA, ...pointsWithB], pointsEqual)
                if(pointsWithAny !== 2) continue

                const pointsToRemove = difference(points, pointsWithA, pointsEqual)
                const effects = [
                    ...removeCandidateFromPoints(board, pointsToRemove, candA),
                    ...removeCandidateFromPoints(board, pointsToRemove, candB)
                ]
                if(effects.length > 0){
                    return {
                        effects,
                        actors: pointsWithAny.map(point => ({point}))
                    }
                }
            }
        }
    }
    return null
}

export const nakedTriple: Technique = (board: Board) => {
    for(let points of getAllClosedRegions()){
        const pointsWith3Cands = points.filter(p => {
            const nCands = getBoardCell(board, p).candidates.length
            return nCands === 2 || nCands === 3 // A triple can contain 2-3 candidates in each cell and still be a triple
        })

        for(let i = 0; i < pointsWith3Cands.length; i++){
            for(let j = i+1; j < pointsWith3Cands.length; j++){
                for(let k = j+1; k < pointsWith3Cands.length; k++) {
                    const pointA = pointsWith3Cands[i]
                    const pointB = pointsWith3Cands[j]
                    const pointC = pointsWith3Cands[k]

                    const candidatesA = getBoardCell(board, pointA).candidates
                    const candidatesB = getBoardCell(board, pointB).candidates
                    const candidatesC = getBoardCell(board, pointC).candidates

                    const allCandidates = unique([...candidatesA, ...candidatesB, ...candidatesC]) as number[]
                    if(allCandidates.length !== 3) continue

                    const pointsToRemove = points.filter(p => !pointsEqual(p, pointA) && !pointsEqual(p, pointB) && !pointsEqual(p, pointC))
                    const effects = allCandidates.flatMap(c => removeCandidateFromPoints(board, pointsToRemove, c))

                    if (effects.length > 0) {
                        return {
                            effects,
                            actors: [{point: pointA}, {point: pointB}, {point: pointC}]
                        }
                    }
                }
            }
        }
    }
    return null
}

export const hiddenTriple: Technique = (board: Board) => {
    for(let points of getAllClosedRegions()){
        for(let candA = 1; candA <= 9; candA++){
            for(let candB = candA+1; candB <= 9; candB++){
                for(let candC = candB+1; candC <= 9; candC++){
                    const pointsWithA = points.filter(p => getBoardCell(board, p).candidates.includes(candA))
                    if(pointsWithA.length < 2 || pointsWithA.length > 3) continue

                    const pointsWithB = points.filter(p => getBoardCell(board, p).candidates.includes(candB))
                    if(pointsWithB.length < 2 || pointsWithB.length > 3) continue

                    const pointsWithC = points.filter(p => getBoardCell(board, p).candidates.includes(candC))
                    if(pointsWithC.length < 2 || pointsWithC.length > 3) continue

                    const pointsWithAny = uniqueBy([...pointsWithA, ...pointsWithB, ...pointsWithC], pointsEqual)
                    if(pointsWithAny.length !== 3) continue

                    const pointsToRemove = difference(points, pointsWithAny, pointsEqual)
                    const allCandidates = [candA, candB, candC]
                    const effects = allCandidates.flatMap(c => removeCandidateFromPoints(board, pointsToRemove, c))
                    if(effects.length > 0){
                        return {
                            effects,
                            actors: pointsWithAny.map(point => ({point}))
                        }
                    }
                }
            }
        }
    }
    return null
}

/**
 * Looks like 4 corners of a rectangle, where either the rows or cols are empty otherwise.
 * Two columns has the same candidate in only two rows. The rest of the rows can be eliminated
 * Two rows has the same candidate in only two cols. The rest of the columns can be eliminated.
 */
export const xWing: Technique = (board: Board) => {
    // Just a shitty way to avoid writing this twice. Example for rows:
    // getAllRegions -> getAllRows()
    // getInverseRegion -> getColumn(point)
    // getInverseRegionNumber -> get point x value
    const findXWing = (cand, getAllRegions, getInverseRegion, getInverseRegionNumber) => {
        // Finds all regions where there is only two cells for a candidate.
        // Groups these by a hash of the x coords if rows, or y coords if col.
        // These groups will then contain two lists of two points if there is an x wing
        const obj = getAllRegions()
            .map(row => row.filter(p => getBoardCell(board, p).candidates.some(c => c === cand)))
            .filter(points => points.length === 2)
            .reduce((obj, points) => {
                const hash = points.map(getInverseRegionNumber).join(',')
                obj[hash] = (obj[hash] ?? [])
                obj[hash].push(points)
                return obj
            }, {})

        for(let pointsList of Object.values<Point[][]>(obj)){
            if(pointsList.length === 2){
                const inverseRegions = pointsList[0].map(getInverseRegion)
                const xWingPoints = pointsList.flatMap(points => points)

                const pointsToRemove = [
                    ...difference(inverseRegions[0], xWingPoints, pointsEqual),
                    ...difference(inverseRegions[1], xWingPoints, pointsEqual)
                ]

                const effects = removeCandidateFromPoints(board, pointsToRemove, cand)
                if(effects.length > 0){
                    return {
                        effects,
                        actors: xWingPoints.map(point => ({point}))
                    }
                }
            }
        }
        return null
    }

    for(let cand = 1; cand <= 9; cand++){

        let result = findXWing(cand, getAllRows, point => getColumn(point.x), getColNumber)
        if(result) return result

        result = findXWing(cand, getAllCols, point => getRow(point.y), getRowNumber)
        if(result) return result
    }
    return null
}