import {
    arraysEqual,
    candidatesExcept,
    difference, getAffectedPoints,
    getAllBoxes,
    getAllClosedRegions,
    getAllCols,
    getAllPoints,
    getAllRows,
    getBoardCell,
    getBox,
    getBoxNumber,
    getColNumber,
    getColumn, getCombinations,
    getRow,
    getRowNumber, groupBy, intersection,
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

const getAffectedPointsInCommon = (points: Point[]) => {
    return points
        .map(getAffectedPoints)
        .reduce<Point[] | null>((inCommon, current) => {
            if(!inCommon) return current
            return intersection(inCommon, current, pointsEqual)
        }, null)
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

    const allPoints = getAllPoints()
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

/**
 * pairs of numbers in a rectangle shape cannot only contain those pairs.
 * Otherwise the sudoku can't be unique.
 * Only applies if there's only two boxes in play.
 *
 * Type 1: 3 corners with two possible candidates. We can eliminate those candidates from the fourth corner
 * (any value that would "resolve" the uniqueness would either make the 3 corners have 0 candidates, or itself eliminate the 4 corner candidates like we would otherwise)
 * TODO: Type 2: 1 extra candidate in two cells that are not diagonals. This will then create a pointer, since the candidate must be in either of those cells.
 * TODO: Type 3: Same as type 2, but more candidates. Treat the cells of the rectangle as one virtual cell, and look for naked pair/triple/quad.
 * TODO: Type 4: Same as type 3, but this time check if one of the rectangle candidates are only in the rectangle cells in that box/column/row. If so, delete the other rectangle candidate.
 * TODO: Type 5: Same as type 2, but the extra candidate is on a diagonal. The candidate must be in one of these. See if there are cells that sees both of these, and eliminate the cand from those.
 * TODO: Type 6: See if one of the rectangle candidates form an x-wing. If so, it must be placed on two points diagonally. If this removes all other candidates from the rectangle, it is invalid, and so can be eliminated.
 * TODO: Hidden, avoidable 1/2, BUG, missing candidates. These seem a bit too exotic tbh.
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

