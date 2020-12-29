import {
    candidatesExcept,
    difference,
    getAllBoxes,
    getAllClosedRegions,
    getAllCols,
    getAllPoints,
    getAllRows,
    getBoardCell,
    getBox,
    getBoxNumber,
    getColNumber,
    getColumn,
    getRow,
    getRowNumber, groupBy,
    pointsEqual,
    removeCandidateFromAffectedPoints,
    removeCandidateFromPoints,
    removeCandidatesFromPoints,
    unique,
    uniqueBy
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
        const actors = [{point}]

        if(effects.length > 0){
            return {effects, actors}
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
                        actors: difference(points, [point], pointsEqual).map(point => ({point}))
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

const findNakedPairs = (board: Board, points: Point[]) => {
    const pairs: {points: Point[], candidates: number[]}[] = []
    const pointsWith2Cands = points.filter(p => getBoardCell(board, p).candidates.length === 2)

    for(let i = 0; i < pointsWith2Cands.length; i++){
        for(let j = i+1; j < pointsWith2Cands.length; j++){
            const pointsInside = [pointsWith2Cands[i], pointsWith2Cands[j]]
            const allCandidates = unique(pointsInside.flatMap(p => getBoardCell(board, p).candidates)) as number[]
            if(allCandidates.length !== 2) continue

            pairs.push({points: pointsInside, candidates: allCandidates})
        }
    }
    return pairs
}

/**
 * In a given row, col, or box, there are two cells with only two candidates. These candidates can be eliminated from the rest of the region.
 */
export const nakedPair: Technique = (board: Board) => {
    for(let points of getAllClosedRegions()){
        const pointsWith2Cands = points.filter(p => getBoardCell(board, p).candidates.length === 2)

        for(let i = 0; i < pointsWith2Cands.length; i++){
            for(let j = i+1; j < pointsWith2Cands.length; j++){
                const pointsInside = [pointsWith2Cands[i], pointsWith2Cands[j]]
                const allCandidates = unique(pointsInside.flatMap(p => getBoardCell(board, p).candidates)) as number[]
                if(allCandidates.length !== 2) continue

                const pointsOutside = difference(points, pointsInside, pointsEqual)
                const effects = removeCandidatesFromPoints(board, pointsOutside, allCandidates)
                const actors = pointsInside.map(point => ({point}))

                if(effects.length > 0){
                    return {effects, actors}
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

                const pointsInside = uniqueBy([...pointsWithA, ...pointsWithB], pointsEqual)
                if(pointsInside.length !== 2) continue

                const pointsOutside = difference(points, pointsInside, pointsEqual)
                const effects = [
                    ...removeCandidatesFromPoints(board, pointsOutside, [candA, candB]),
                    ...removeCandidatesFromPoints(board, pointsInside, candidatesExcept([candA, candB]))
                ]
                const actors = pointsInside.map(point => ({point}))

                if(effects.length > 0){
                    return {effects, actors}
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
                    const pointsInside = [pointsWith3Cands[i], pointsWith3Cands[j], pointsWith3Cands[k]]
                    const allCandidates = unique(pointsInside.flatMap(p => getBoardCell(board, p).candidates)) as number[]
                    if(allCandidates.length !== 3) continue

                    const pointsOutside = difference(points, pointsInside, pointsEqual)
                    const effects = removeCandidatesFromPoints(board, pointsOutside, allCandidates)
                    const actors = pointsInside.map(point => ({point}))

                    if (effects.length > 0) {
                        return {effects, actors}
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

                    const pointsInside = uniqueBy([...pointsWithA, ...pointsWithB, ...pointsWithC], pointsEqual)
                    if(pointsInside.length !== 3) continue

                    const pointsOutside = difference(points, pointsInside, pointsEqual)
                    const effects = [
                        ...removeCandidatesFromPoints(board, pointsOutside, [candA, candB, candC]),
                        ...removeCandidatesFromPoints(board, pointsInside, candidatesExcept([candA, candB, candC]))
                    ]
                    const actors = pointsInside.map(point => ({point}))

                    if(effects.length > 0){
                        return {effects, actors}
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

        const xWings = Object.values<Point[][]>(obj).filter(list => list.length === 2)

        for(let xWingPointLists of xWings){
            const inverseRegionNumbers = unique(xWingPointLists.flatMap(list => list.map(getInverseRegionNumber)))
            const inverseRegions = inverseRegionNumbers.map(getInverseRegion)
            const xWingPoints = xWingPointLists.flat()

            const pointsToRemove = inverseRegions.flatMap(points => difference(points, xWingPoints, pointsEqual))
            const effects = removeCandidateFromPoints(board, pointsToRemove, cand)
            const actors = xWingPoints.map(point => ({point}))

            if(effects.length > 0){
                return {effects, actors}
            }
        }
        return null
    }

    for(let cand = 1; cand <= 9; cand++){
        let result = findXWing(cand, getAllRows, getColumn, getColNumber)
        if(result) return result

        result = findXWing(cand, getAllCols, getRow, getRowNumber)
        if(result) return result
    }
    return null
}


/**
 * Two candidates on the same row or column may force some other cells to be filled in each case.
 * The cells that these in turn eliminate may overlap with each other. And so we can eliminate them.
 */
export const skyscraper: Technique = (board: Board) => {
    return null
}

/**
 * pairs of numbers in a rectangle shape cannot only contain those pairs.
 * Otherwise the sudoku can't be unique.
 * Only applies if there's only two boxes in play.
 *
 * Type 1: 3 corners with two possible candidates. We can eliminate those candidates from the fourth corner
 * (any value that would "resolve" the uniqueness would either make the 3 corners have 0 candidates, or itself eliminate the 4 corner candidates like we would otherwise)
 */
export const uniqueRectangle: Technique = (board: Board) => {
    for(let points of getAllRows()){
        const pairs = findNakedPairs(board, points)
        for(let pair of pairs){
            const colPairs = [
                ...findNakedPairs(board, getColumn(pair.points[0].x)),
                ...findNakedPairs(board, getColumn(pair.points[1].x))
            ]

            const matchingPairs = colPairs
                .filter(colPair => unique([...colPair.candidates, ...pair.candidates]).length === 2) // Has the same two candidates
                .filter(colPair => difference(pair.points, colPair.points, pointsEqual).length === 1) // Shares one point
                .filter(colPair => unique([...colPair.points, ...pair.points].map(getBoxNumber)).length === 2) // In exactly two boxes

            for(let colPair of matchingPairs){
                const corners = uniqueBy([...colPair.points, ...pair.points], pointsEqual)
                const missingCorner = {
                    x: Object.values<any>(groupBy(corners, p => p.x)).filter(xs => xs.length === 1).map(xs => xs[0])[0].x,
                    y: Object.values<any>(groupBy(corners, p => p.y)).filter(ys => ys.length === 1).map(ys => ys[0])[0].y
                }
                const candidates = pair.candidates
                const effects = removeCandidatesFromPoints(board, [missingCorner], candidates)
                const actors = corners.map(point => ({point}))

                if(effects.length > 0){
                    return {effects, actors}
                }
            }
        }
    }

    return null
}