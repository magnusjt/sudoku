import { Effect, EliminationEffect, Point, SolverBoard, Technique, ValueEffect } from '../types'
import {
    removeCandidateFromAffectedPoints, removeCandidateFromPoints,
    removeCandidatesFromPoints
} from '../utils/effects'
import { allResults, first, unique, uniqueBy } from '../utils/misc'
import {
    allCandidates, cloneBoard, getAffectedPoints,
    getAffectedPointsInCommon, getAllHousesMinusFilledPoints,
    getAllPoints, getAllUnfilledPoints,
    getBoardCell, getPointsWithCandidates,
    getPointsWithNCandidates, pointsEqual,
} from '../utils/sudokuUtils'

const getPointKey = (point: Point) => `${point.y}-${point.x}`

type Link = {
    type: 'weak' | 'strong'
    prev: {
        point: Point
        cand: number
    }
    next: {
        point: Point
        cand: number
    }
}

type Table = {
    [key: string]: {
        point: Point
        links: Link[]
    }
}

const getLinks = (effectsIfTrue: EliminationEffect[], effectsIfFalse: ValueEffect[], point: Point, cand: number): Link[] => {
    const prev = { point, cand }
    return [
        ...effectsIfFalse.map((eff) => ({
            type: 'strong',
            prev,
            next: {
                point: eff.point,
                cand: eff.number
            }
        } as unknown as Link)),
        ...effectsIfTrue.flatMap((eff) => eff.numbers.map(cand => ({
            type: 'weak',
            prev,
            next: {
                point: eff.point,
                cand
            }
        } as Link)))
    ]
}

/**
 * Find all naked and hidden singles that result from a strong link (e.g. where a candidate is NOT set).
 * Hinges on all actual singles being found before doing this.
 * Also: I guess one could do a lot more here, but singles are kind of the "direct" effect.
 *
 * NB: We need to find naked singles because eliminating a candidate for a strong link may mean the strong link
 * is between the candidate and another candidate in the cell (which is now a naked single)
 */
const getSingleEffects = (board: SolverBoard) => {
    const effects: ValueEffect[] = []

    // Hidden singles
    for(let points of getAllHousesMinusFilledPoints(board)){
        for(let cand = 1; cand <= 9; cand++){
            const pointsWithCand = points.filter(p => getBoardCell(board, p).candidates.some(c => c === cand))
            if(pointsWithCand.length === 1){
                const point = pointsWithCand[0]
                effects.push({type: 'value', point, number: cand} as const)
            }
        }
    }

    // Naked singles
    getPointsWithNCandidates(board, getAllPoints(), 1)
        .forEach(point => {
            const cand = getBoardCell(board, point).candidates[0]
            effects.push({type: 'value', point, number: cand} as const)
        })

    return uniqueBy(effects, (eff1, eff2) => pointsEqual(eff1.point, eff2.point) && eff1.cand === eff2.cand)
}

/**
 * The table concept I glanced from hodoku. Called trebors tables or something like that.
 * The idea is to record what effects occur when a candidate is either set or not set. Only direct effects are considered.
 * Direct in this case is hidden/naked singles and just basic eliminations.
 * When a candidate is set, we can use it to make weak links towards all its effected cells. Effects are basic eliminations.
 * When a candidate is not set, we can use it to make strong links towards all its effected cells. Effects are naked/hidden singles here.
 */
const createTable = (board: SolverBoard, points: Point[], cands: number[]) => {
    board = cloneBoard(board)
    const table: Table = {}
    for(let point of points){
        for(let cand of cands){
            const cell = getBoardCell(board, point)
            if(!cell.candidates.includes(cand)){
                continue
            }

            const effectsIfTrue = removeCandidateFromAffectedPoints(board, point, cand) as EliminationEffect[]

            // Temporarily remove candidate to find effectsIfFalse
            // NB: Will find effects on totally unrelated hidden singles as well, so don't run this until all hidden singles are found
            cell.candidates = cell.candidates.filter(c => c !== cand)
            const effectsIfFalse = getSingleEffects(board)
            cell.candidates.push(cand)

            if(effectsIfTrue.length > 0 || effectsIfFalse.length > 0){
                const links = getLinks(effectsIfTrue, effectsIfFalse, point, cand)
                table[getPointKey(point)] = table[getPointKey(point)] ?? { point, links: [] }
                table[getPointKey(point)].links.push(...links)
            }
        }
    }
    return table
}

const getAllLinks = (table: Table, point: Point) => {
    const item = table[getPointKey(point)]
    return item ? item.links : []
}

const getLinkKey = (point, cand) => {
    return `${getPointKey(point)}${cand}` // Avoids visiting the same point with same cand twice
}

/**
 * A chain alternates between weak and strong links. This ensures the next step follows the one before it.
 * (Set value -> (weak) -> dont't set value -> (strong) -> set value -> etc).
 *
 * This method finds all chains, but:
 * 1. Stops before they become loops/circular. It's therefore not possible to check for contradictions
 * 2. No branching. Just one link for each cell. So it cannot be used for coloring.
 *
 */
const _iterateChainsInTable = (table: Table, keepLink, check, depth: number) => {
    const followLink = (link, requiredType = 'weak', prevChain, seen) => {
        const key = getLinkKey(link.next.point, link.next.cand)
        if(seen.has(key)){
            return false
        }
        // The cand is now set/removed when starting from prev point. Prevent it from being set/removed again
        // If we're to implement forcing chains, this won't work as we need to look for contradictions.
        // Can probably implement that around here.
        seen = new Set([...seen]).add(getLinkKey(link.prev.point, link.prev.cand))

        if(!keepLink(link)){
            return false
        }

        const chain = [...prevChain, link]
        let currDepth = chain.length
        if(currDepth > depth){
            return false
        }
        if(depth === currDepth){
            if(check(chain)){
                return true
            }
        }

        // Although a strong link can be followed by a strong or weak link (as a strong link can be used as a weak link),
        // we have to choose the weak link. This is because link types must be alternating (the candidate is not set -> leads to set -> not set -> etc).
        // We record both strong and weak links in the table,
        // so if a link is strong, we always have the weak counterpart recorded as well.
        const nextLinkType = link.type === 'strong' ? 'weak' : 'strong'
        const cand = link.next.cand

        const nextLinks = getAllLinks(table, link.next.point)
            .filter(link => link.prev.cand === cand && link.type === nextLinkType)

        for(let nextLink of nextLinks){
            const done = followLink(nextLink, requiredType, chain, seen)
            if(done) return true
        }
    }

    for(let { links } of Object.values(table)){
        for(let link of links){
            const done = followLink(link, 'weak', [], new Set())
            if(done) return true
        }
    }
    return false
}

const iterateChainsInTable = (table: Table, keepLink, check) => {
    for(let depth = 2; depth <= 12; depth++){
        const result = _iterateChainsInTable(table, keepLink, check, depth)
        if(result) return true
    }
    return false
}

/**
 * Remote pairs are a chain of cells with the same two candidates, like a pair but at least 4 cells,
 * each affecting the next. E.g.
 * 45 45 45 45
 * Can be either
 *
 * 4  5  4  5
 * 5  4  5  4
 *
 * So if any cells in the chain length 3+2n apart has cells they see in common, we can eliminate the pair candidates from the cells in common.
 * Just like a normal naked pair actually, but with more steps.
 *
 * This implementation is basically the same as for xy chains, but with the restriction that all cells in
 * the chain must have the same candidates. This ensures that the result is actually a remote pair instead of an xy chain.
 * See comments below for more details.
 */
export function remotePairChain(board: SolverBoard){
    const biValuePoints = getPointsWithNCandidates(board, getAllPoints(), 2)
    const table = createTable(board, biValuePoints, allCandidates)

    let result: any = null
    const keepLink = (link) => {
        // Every link is between pairs
        return unique([
            ...getBoardCell(board, link.prev.point).candidates,
            ...getBoardCell(board, link.next.point).candidates,
        ]).length === 2
    }
    iterateChainsInTable(table, keepLink, (chain: Link[]) => {
        if(chain.length <= 2) return false;
        const firstLink = chain[0]
        const lastLink = chain[chain.length - 1]
        // Starts and ends with strong link. Read this as:
        // If we DON'T start with the candidate in the first cell of the chain
        // then the last cell will definitely contain the candidate
        // So the candidate is in either the first or the last cell
        if(!(firstLink.type === 'strong' && lastLink.type === 'strong')){
            return false
        }
        // Make sure that the ending candidate is actually the same as the starting candidate
        if(firstLink.prev.cand !== lastLink.next.cand){
            return false
        }
        const start = firstLink.prev.point
        const end = lastLink.next.point
        // Yes, we can eliminate both candidates.
        // Why? Because we already check that all cells in the chain have the same two candidates.
        // We can then start with the other candidate and arrive at the exact same conclusion.
        const cands = getBoardCell(board, start).candidates
        const affected = getAffectedPointsInCommon([start, end])
        const effects = removeCandidatesFromPoints(board, affected, cands)
        const points = [
            chain[0].prev.point,
            ...chain.map(link => link.next.point),
        ]
        const actors = points.map(point => ({point}))
        if(effects.length > 0){
            result = {effects, actors}
            return true
        }
    })

    return result
}

/**
 * x chains consider only one candidate in a chain.
 * It should start and end with a strong link.
 * An initial strong link means we start by NOT choosing the candidate, then follow the chain.
 * An ending strong link means that the final value will definitely be the candidate given the initial strong link.
 */
export function xChain(board: SolverBoard){
    const unfilledPoints = getAllUnfilledPoints(board)
    const table = createTable(board, unfilledPoints, allCandidates)

    let result: any = null
    const keepLink = (link: Link) => link.prev.cand === link.next.cand
    iterateChainsInTable(table, keepLink, (chain: Link[]) => {
        if(chain.length <= 2) return false;
        const firstLink = chain[0]
        const lastLink = chain[chain.length - 1]
        if(!(firstLink.type === 'strong' && lastLink.type === 'strong')){
            return false
        }
        const start = firstLink.prev.point
        const end = lastLink.next.point
        const cand = firstLink.prev.cand
        const affected = getAffectedPointsInCommon([start, end])
        const effects = removeCandidatesFromPoints(board, affected, [cand])
        const points = [
            chain[0].prev.point,
            ...chain.map(link => link.next.point),
        ]
        const actors = points.map(point => ({point}))
        if(effects.length > 0){
            result = {effects, actors}
            return true
        }
    })

    return result
}

/**
 * xy chains consider only bi value points
 * Like x chains and remote pairs, they must start and end with strong links
 * Also, the initial and final links must be on the same candidate.
 * This ensures that the candidate is in one of those cells.
 */
export function xyChain(board: SolverBoard){
    const biValuePoints = getPointsWithNCandidates(board, getAllPoints(), 2)
    const table = createTable(board, biValuePoints, allCandidates)

    let result: any = null
    const keepLink = () => true
    iterateChainsInTable(table, keepLink, (chain: Link[]) => {
        if(chain.length <= 2) return false;
        const firstLink = chain[0]
        const lastLink = chain[chain.length - 1]
        if(!(firstLink.type === 'strong' && lastLink.type === 'strong')){
            return false
        }
        if(firstLink.prev.cand !== lastLink.next.cand){
            return false
        }
        const start = firstLink.prev.point
        const end = lastLink.next.point
        const cand = firstLink.prev.cand
        const affected = getAffectedPointsInCommon([start, end])
        const effects = removeCandidatesFromPoints(board, affected, [cand])
        const points = [
            chain[0].prev.point,
            ...chain.map(link => link.next.point),
        ]
        const actors = points.map(point => ({point}))
        if(effects.length > 0){
            result = {effects, actors}
            return true
        }
    })

    return result
}

function *simpleColoringGenerator(board: SolverBoard){
    const unfilledPoints = getAllUnfilledPoints(board)
    const table = createTable(board, unfilledPoints, allCandidates)
    const oppositeColor = (color) => color === 'yes' ? 'no' : 'yes'

    const getNextQueueItems = (pointKey: string, cand: number, color: string) => {
        return table[pointKey].links
            .filter(link => link.prev.cand === cand && link.next.cand === cand && link.type === 'strong')
            .map(link => ({ point: link.next.point, color }))
    }

    const colorFromPoint = (startingPoint: Point, cand: number) => {
        const startingKey = getPointKey(startingPoint)
        const colors = {[startingKey]: { color: 'yes', point: startingPoint }}
        const queue = getNextQueueItems(startingKey, cand, 'no')

        while(queue.length > 0){
            const { point, color } = queue.shift()!

            const key = getPointKey(point)
            if(colors[key]) continue
            colors[key] = {color, point}

            queue.push(...getNextQueueItems(key, cand, oppositeColor(color)))
        }

        return colors
    }

    // Sort so we get easier results first
    const candsWithPoints = allCandidates
        .map(cand => {
            return {
                cand,
                points: getPointsWithCandidates(board, unfilledPoints, [cand])
            }
        })
        .sort((a, b) => a.points.length - b.points.length)

    for(let { cand, points } of candsWithPoints){
        // Avoid checking points within the same coloring multiple times
        const checked = new Set()
        for(let startingPoint of points){
            if(checked.has(getPointKey(startingPoint))) continue

            const colors = colorFromPoint(startingPoint, cand)

            Object.values(colors).forEach(({point}) => {
                checked.add(getPointKey(point))
            })

            if(Object.values(colors).length > 18) continue // 9*2=18, that is each e.g. row has a conjugate pair. Doesn't make sense to color in more than that?

            const uncoloredPoints = getPointsWithCandidates(board, points, [cand])
                .filter(point => !colors[getPointKey(point)])

            const effects: Effect[] = []

            // Check color traps:
            // All points seeing two different colors must be eliminated, since one of those colors must mean that the cand is set
            for(let uncoloredPoint of uncoloredPoints){
                const seenColors = unique(
                    getAffectedPoints(uncoloredPoint)
                        .map(affected => colors[getPointKey(affected)]?.color ?? '')
                        .filter(color => color !== '')
                )

                if(seenColors.length === 2){
                    effects.push(...removeCandidateFromPoints(board, [uncoloredPoint], cand))
                }
            }

            // Check color wraps:
            // Points with the same color seeing each other must all be false
            for(let {point, color} of Object.values(colors)){
                const seesSameColor = getAffectedPoints(point)
                    .some(affected => colors[getPointKey(affected)]?.color === color)

                if(seesSameColor){
                    effects.push(...removeCandidateFromPoints(board, [point], cand))
                }
            }

            const actors = Object.values(colors).map(x => ({point: x.point}))

            if(effects.length > 0){
                yield {effects, actors}
            }
        }
    }

    return null
}

export const simpleColoring: Technique = (board: SolverBoard) => first(simpleColoringGenerator(board))
export const allSimpleColorings: Technique = (board: SolverBoard) => allResults(simpleColoringGenerator(board))