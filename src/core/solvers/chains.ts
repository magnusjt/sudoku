import {
    Actor,
    Effect,
    EliminationEffect,
    Point,
    SetValueEffect,
    SolverBoard,
    TechniqueResult
} from '../types'
import {
    applyEffects,
    removeCandidateFromAffectedPoints, removeCandidateFromPoints,
    removeCandidatesFromPoints, uniqueEffects
} from '../utils/effects'
import { allResults, arraysEqual, difference, first, unique } from '../utils/misc'
import {
    allCandidates, candidatesExcept, cloneBoard, getAffectedPoints,
    getAffectedPointsInCommon, getAllHousesMinusFilledPoints,
    getAllPoints, getAllUnfilledPoints,
    getBoardCell, getBox, getBoxNumber, getColNumber, getColumn, getPointsWithCandidates,
    getPointsWithNCandidates, getRow, getRowNumber, pointsEqual, pointsSeeEachOther,
} from '../utils/sudokuUtils'
import { allInversePointers, allPointers } from './pointer'

const getPointKey = (point: Point) => `${point.y}-${point.x}`

type Link = NormalLink

type NormalLink = {
    type: 'weak' | 'strong'
    group: false
    prev: {
        point: Point
        cand: number
    }
    next: {
        point: Point
        cand: number
    }
}
type GroupLink = {
    type: 'strong-strong' | 'weak-weak' | 'weak' | 'strong'
    actors: Actor[]
    group: true
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

const getLinks = (effectsIfTrue: EliminationEffect[], effectsIfFalse: SetValueEffect[], point: Point, cand: number): NormalLink[] => {
    const prev = { point, cand }
    return [
        ...effectsIfFalse.map((eff) => ({
            type: 'strong' as const,
            group: false as const,
            prev,
            next: {
                point: eff.point,
                cand: eff.number
            }
        })),
        ...effectsIfTrue.flatMap((eff) => eff.numbers.map(cand => ({
            type: 'weak' as const,
            group: false as const,
            prev,
            next: {
                point: eff.point,
                cand
            }
        })))
    ]
}

const getGroupLinks = (
    resultsIfTrue: TechniqueResult<EliminationEffect>[],
    resultsIfFalse: TechniqueResult<EliminationEffect>[],
    point: Point,
    cand: number
): GroupLink[] => {
    const prev = { point, cand }

    return [
        ...resultsIfFalse.flatMap(result => {
            const actors = result.actors
            return result.effects.flatMap((eff) => eff.numbers.map(cand => ({
                type: 'strong-strong' as const,
                group: true as const,
                actors,
                prev,
                next: {
                    point: eff.point,
                    cand
                }
            })))
        }),
        ...resultsIfTrue.flatMap(result => {
            const actors = result.actors
            return result.effects.map((eff) => ({
                type: 'weak' as const,
                group: true as const,
                actors,
                prev,
                next: {
                    point: eff.point,
                    cand
                }
            }))
        })
    ]
}

const getNakedSingles = (board: SolverBoard): SetValueEffect[] => {
    const effects: SetValueEffect[] = []
    getPointsWithNCandidates(board, getAllPoints(), 1)
        .forEach(point => {
            const cand = getBoardCell(board, point).candidates[0]
            effects.push({type: 'value', point, number: cand} as const)
        })
    return effects
}
const getHiddenSingles = (board: SolverBoard): SetValueEffect[] => {
    const effects: SetValueEffect[] = []
    for(let points of getAllHousesMinusFilledPoints(board)){
        for(let cand = 1; cand <= 9; cand++){
            const pointsWithCand = points.filter(p => getBoardCell(board, p).candidates.some(c => c === cand))
            if(pointsWithCand.length === 1){
                const point = pointsWithCand[0]
                effects.push({type: 'value', point, number: cand} as const)
            }
        }
    }
    return effects
}

const getValueFalseEffects = (board: SolverBoard): SetValueEffect[] => {
    return uniqueEffects([
        ...getNakedSingles(board),
        ...getHiddenSingles(board)
    ])
}

const getValueTrueEffects = (board: SolverBoard, point: Point, cand: number): EliminationEffect[] => {
    const cell = getBoardCell(board, point)
    return [
        ...removeCandidatesFromPoints(board, [point], cell.candidates.filter(c => c !== cand)),
        ...removeCandidateFromAffectedPoints(board, point, cand) as EliminationEffect[]
    ]
}

const getGroupResults = (board: SolverBoard, singleEliminationEffects: EliminationEffect[]): TechniqueResult<EliminationEffect>[] => {
    board = cloneBoard(board)
    board = applyEffects(board, singleEliminationEffects)
    return [
        ...allPointers(board),
        ...allInversePointers(board)
    ]
}

/**
 * The table concept I glanced from hodoku. Called trebors tables or something like that.
 * The idea is to record what effects occur when a candidate is either set or not set. Only direct effects are considered.
 * Direct in this case is hidden/naked singles and just basic eliminations.
 * When a candidate is set, we can use it to make weak links towards all its effected cells. Effects are basic eliminations.
 * When a candidate is not set, we can use it to make strong links towards all its effected cells. Effects are naked/hidden singles here.
 */
const createTable = (board: SolverBoard, points: Point[], cands: number[]) => {
    // Ensure the cells with the fewest candidates are stored first.
    // These are the most likely starting cells that a human would choose.
    points = points.sort((a, b) => {
        return getBoardCell(board, a).candidates.length - getBoardCell(board, b).candidates.length
    })
    board = cloneBoard(board)
    const table: Table = {}
    for(let point of points){
        for(let cand of cands){
            const cell = getBoardCell(board, point)
            if(!cell.candidates.includes(cand)){
                continue
            }

            const originalCands = [...cell.candidates]

            // Record "direct" effects when setting true
            // Here we can record indirect effects as well (e.g. pointers) if we want group links
            const effectsIfTrue = getValueTrueEffects(board, point, cand)
                .filter(eff => points.some(p => pointsEqual(p, eff.point)))

            // Temporarily remove candidate to find effectsIfFalse
            // NB: Will find indirect effects as well. Works as intended so long as all hidden singles are found before this.
            cell.candidates = cell.candidates.filter(c => c !== cand)
            const effectsIfFalse = getValueFalseEffects(board)
                .filter(eff => points.some(p => pointsEqual(p, eff.point)))
            cell.candidates = originalCands

            if(effectsIfTrue.length > 0 || effectsIfFalse.length > 0){
                const normalLinks = getLinks(effectsIfTrue, effectsIfFalse, point, cand)
                table[getPointKey(point)] = table[getPointKey(point)] ?? { point, links: [] }
                table[getPointKey(point)].links.push(...normalLinks)
            }
        }
    }
    return table
}

const getAllLinks = (table: Table, point: Point) => {
    const item = table[getPointKey(point)]
    return item ? item.links : []
}

const linkIsInternal = (link: Link) => pointsEqual(link.prev.point, link.next.point)

type QueueItem = {
    seen: Set<number>
    chain: Link[]
}

const iterateChainsInTable = (table: Table, keepLink, check, maxDepth: number = 13) => {
    const isValidNextLink = (queueItem: QueueItem, link: Link) => {
        const first = queueItem.chain[0]
        const last = queueItem.chain[queueItem.chain.length - 1]

        const requiredLinkType = last.type === 'strong' ? 'weak' : 'strong'

        const lastWasInternal = last.prev.point.id === last.next.point.id
        const nextIsInternal = link.prev.point.id === link.next.point.id

        const isLoop = first.prev.point.id === link.next.point.id
        const isLasso = !isLoop && !nextIsInternal && queueItem.seen.has(link.next.point.id)

        return (
            link.prev.cand === last.next.cand &&
            link.type === requiredLinkType &&
            !isLasso &&
            !(lastWasInternal && nextIsInternal) &&
            keepLink(link)
        )
    }

    const queue: QueueItem[] = Object.values(table)
        .flatMap(x => x.links
            .filter(keepLink)
            .map(link => ({ chain: [link], seen: new Set([link.prev.point.id]) }))
        )

    let i = 0
    while(i < queue.length){
        const queueItem = queue[i++] // Don't shift the queue. Turns out to be super slow when it becomes large.
        const { chain } = queueItem
        const firstLink = chain[0]
        const lastLink = chain[chain.length - 1]

        const isLoop = firstLink.prev.point.id === lastLink.next.point.id
        if(check(chain, isLoop)){
            return true
        }

        const nextLinks = getAllLinks(table, lastLink.next.point).filter(link => isValidNextLink(queueItem, link))
        const seen = new Set([...queueItem.seen, lastLink.next.point.id])
        if(queueItem.chain.length >= maxDepth){
            continue
        }

        for(let nextLink of nextLinks){
            queue.push({ chain: [...chain, nextLink], seen })
        }
    }

    return false
}

const chainToActors = (chain: Link[]): Actor[] => {
    return [
        {
            point: chain[0].prev.point,
            cand: chain[0].prev.cand,
            chainSet: chain[0].type === 'strong' ? 'no' : 'yes'
        },
        ...chain.map(link => {
            return {
                point: link.next.point,
                cand: link.next.cand,
                chainSet: link.type === 'strong' ? 'yes' as const : 'no' as const
            }
        }),
    ]
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
        return arraysEqual(
            getBoardCell(board, link.prev.point).candidates,
            getBoardCell(board, link.next.point).candidates,
            (a, b) => a === b
        )
    }
    const maxDepth = 20
    iterateChainsInTable(table, keepLink, (chain: Link[], isLoop) => {
        if(isLoop) return false
        if(chain.length <= 2) return false
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

        if(effects.length > 0){
            result = {effects, actors: chainToActors(chain)}
            return true
        }
    }, maxDepth)

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

    const maxDepth = 10
    let result: any = null
    const keepLink = (link: Link) => link.prev.cand === link.next.cand
    iterateChainsInTable(table, keepLink, (chain: Link[], isLoop) => {
        if(isLoop) return false
        if(chain.length <= 2) return false
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

        if(effects.length > 0){
            result = {effects, actors: chainToActors(chain)}
            return true
        }
    }, maxDepth)

    return result
}

const getDiscontinuousNiceLoop = (board: SolverBoard, chain: Link[], isLoop: boolean) => {
    if(!isLoop){
        return null
    }

    const firstLink = chain[0]
    const lastLink = chain[chain.length - 1]

    if(firstLink.type === 'strong' && lastLink.type === 'strong' && firstLink.prev.cand === lastLink.next.cand){
        const effects = removeCandidatesFromPoints(board, [firstLink.prev.point], candidatesExcept([firstLink.prev.cand]))
        if(effects.length > 0){
            return {effects, actors: chainToActors(chain)}
        }
    }
    if(firstLink.type === 'weak' && lastLink.type === 'strong' && firstLink.prev.cand !== lastLink.next.cand){
        const effects = removeCandidatesFromPoints(board, [firstLink.prev.point], [firstLink.prev.cand])
        if(effects.length > 0){
            return {effects, actors: chainToActors(chain)}
        }
    }

    return null
}

const getContinuousNiceLoop = (board: SolverBoard, chain: Link[], isLoop: boolean) => {
    if(!isLoop){
        return null
    }

    const firstLink = chain[0]
    const lastLink = chain[chain.length - 1]

    if(
        (
            (firstLink.type === 'weak' && lastLink.type === 'strong') ||
            (firstLink.type === 'strong' && lastLink.type === 'weak')
        ) &&
        firstLink.prev.cand === lastLink.next.cand
    ){
        const pointsInChain = chain.map(link => link.next.point) // It's a loop, so the first point is included
        const weakLinks = chain.filter(link => link.type === 'weak')

        const effects: Effect[] = []

        for(let link of weakLinks){
            if(linkIsInternal(link)){
                effects.push(
                    ...removeCandidatesFromPoints(board, [link.prev.point], candidatesExcept([link.prev.cand, link.next.cand]))
                )
            }else{
                let pointsToRemove: Point[] = []
                if(getBoxNumber(link.prev.point) === getBoxNumber(link.next.point)){
                    pointsToRemove.push(...getBox(link.prev.point))
                }
                if(getColNumber(link.prev.point) === getColNumber(link.next.point)){
                    pointsToRemove.push(...getColumn(link.prev.point.x))
                }
                if(getRowNumber(link.prev.point) === getRowNumber(link.next.point)){
                    pointsToRemove.push(...getRow(link.prev.point.y))
                }
                pointsToRemove = difference(pointsToRemove, pointsInChain, pointsEqual)
                const cand = link.next.cand
                effects.push(
                    ...removeCandidatesFromPoints(board, pointsToRemove, [cand])
                )
            }
        }
        if(effects.length > 0){
            return {effects, actors: chainToActors(chain)}
        }
    }
    return null
}

const getAicType1 = (board: SolverBoard, chain: Link[], isLoop: boolean) => {
    const firstLink = chain[0]
    const lastLink = chain[chain.length - 1]

    if(isLoop){
        return null
    }

    if(firstLink.type === 'strong' && lastLink.type === 'strong'){
        const cand = firstLink.prev.cand
        const affected = getAffectedPointsInCommon([firstLink.prev.point, lastLink.next.point])
        const effects = removeCandidatesFromPoints(board, affected, [cand])

        if(effects.length > 0){
            return {effects, actors: chainToActors(chain)}
        }
    }

    return null
}

const getAicType2 = (board: SolverBoard, chain: Link[], isLoop: boolean) => {
    const firstLink = chain[0]
    const lastLink = chain[chain.length - 1]

    if(isLoop){
        return null
    }

    if(!(firstLink.type === 'strong' && lastLink.type === 'strong')){
        if(pointsSeeEachOther(firstLink.prev.point, lastLink.next.point)){
            const effects = [
                ...removeCandidateFromPoints(board, [firstLink.prev.point], lastLink.next.cand),
                ...removeCandidateFromPoints(board, [lastLink.next.point], firstLink.prev.cand)
            ]

            if(effects.length > 0){
                return {effects, actors: chainToActors(chain)}
            }
        }
    }

    return null
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

    const maxDepth = 20
    let result: any = null
    const keepLink = () => true
    iterateChainsInTable(table, keepLink, (chain: Link[], isLoop) => {
        if(isLoop) return false
        if(chain.length <= 2) return false
        const firstLink = chain[0]
        const lastLink = chain[chain.length - 1]
        // NOTE: We might restrict each strong link to be within cells as well.
        // Right now we allow strong links to go directly to other cells.
        // Not sure if this is still considered an xy chain. I guess it still is, but with fewer steps.
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

        if(effects.length > 0){
            result = {effects, actors: chainToActors(chain)}
            return true
        }
    }, maxDepth)

    return result
}

/**
 * Alternating inference chain type 1.
 * Like xy-chain, begins and ends with the same candidate.
 * The only difference is that we consider all cells, not just bi-value cells
 *
 * AIC type 2 begins and ends with different candidates.
 * The end candidate can then be eliminated from the start cell, and vice versa
 */
export function aicType12(board: SolverBoard){
    const unfilledPoints = getAllUnfilledPoints(board)
    const table = createTable(board, unfilledPoints, allCandidates)

    const maxDepth = 13
    let result: any = null
    const keepLink = () => true

    iterateChainsInTable(table, keepLink, (chain: Link[], isLoop) => {
        if(chain.length <= 2) return false

        getDiscontinuousNiceLoop(board, chain, isLoop)
        getAicType1(board, chain, isLoop)
        getAicType2(board, chain, isLoop)
        getContinuousNiceLoop(board, chain, isLoop)

        return true
    }, maxDepth)

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

            const uncoloredPoints = points.filter(point => !colors[getPointKey(point)])

            const effects: EliminationEffect[] = []

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

export const simpleColoring = (board: SolverBoard) => first(simpleColoringGenerator(board))
export const allSimpleColorings = (board: SolverBoard) => allResults(simpleColoringGenerator(board))