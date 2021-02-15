import {
    EliminationEffect, GroupEliminationEffect,
    GroupSetValueEffect,
    Point,
    SetValueEffect,
    SolverBoard
} from '../types'
import {
    allCandidates,
    cloneBoard,
    getAllHousesMinusFilledPoints,
    getBoardCell,
    getBox,
    getBoxGroups,
    getBoxNumber,
    getColNumber,
    getColumn,
    getPointsWithCandidates,
    getRow,
    getRowNumber, pointsEqual
} from '../utils/sudokuUtils'
import {
    effectsEqual,
    removeCandidateFromAffectedPoints,
    removeCandidatesFromPoints,
    uniqueEffects
} from '../utils/effects'
import { intersectionOfAll, unique } from '../utils/misc'

export const getPointKey = (point: Point) => point.id
export const getGroupId = (group: Point[]) => group.map(p => p.id).join('-')

export type SingleNode = {
    type: 'single'
    point: Point
    cand: number
}
export type GroupNode = {
    type: 'group'
    points: Point[]
    groupId: string
    cand: number
}
export type LinkNode = SingleNode | GroupNode

export type Link<P extends LinkNode = LinkNode, N extends LinkNode = LinkNode> = {
    type: 'weak' | 'strong'
    prev: P
    next: N
}
export type SingleLink = Link<SingleNode, SingleNode>

export type Table<T extends Link = Link> = {
    [key: string]: {
        point: Point
        links: T[]
    }
}

export type SingleTable = Table<SingleLink>

const getLinks = (
    node: SingleNode | GroupNode,
    effectsIfTrue: EliminationEffect[],
    effectsIfFalse: SetValueEffect[],
    groupEffectsIfTrue: GroupEliminationEffect[],
    groupEffectsIfFalse: GroupSetValueEffect[]
): Link[] => {
    const prev = node
    return [
        ...effectsIfFalse.map((eff) => ({
            type: 'strong' as const,
            prev,
            next: {
                type: 'single' as const,
                point: eff.point,
                cand: eff.number
            }
        })),
        ...effectsIfTrue.flatMap((eff) => eff.numbers.map(cand => ({
            type: 'weak' as const,
            prev,
            next: {
                type: 'single' as const,
                point: eff.point,
                cand
            }
        }))),
        ...groupEffectsIfFalse.map((eff) => ({
            type: 'strong' as const,
            prev,
            next: {
                type: 'group' as const,
                points: eff.group,
                groupId: eff.groupId,
                cand: eff.number
            }
        })),
        ...groupEffectsIfTrue.map((eff) => ({
            type: 'weak' as const,
            prev,
            next: {
                type: 'group' as const,
                points: eff.group,
                groupId: eff.groupId,
                cand: eff.number
            }
        }))
    ]
}

const getNakedSingle = (board: SolverBoard, point: Point): SetValueEffect[] => {
    const cell = getBoardCell(board, point)
    if(cell.candidates.length === 1) {
        return [{type: 'value', point, number: cell.candidates[0]}]
    }
    return []
}
const getHiddenSingles = (board: SolverBoard): SetValueEffect[] => {
    const effects: SetValueEffect[] = []
    for(let house of getAllHousesMinusFilledPoints(board)){
        for(let cand = 1; cand <= 9; cand++){
            const pointsWithCand = house.filter(p => getBoardCell(board, p).candidates.some(c => c === cand))
            if(pointsWithCand.length === 1){
                const point = pointsWithCand[0]
                effects.push({type: 'value', point, number: cand} as const)
            }
        }
    }
    return effects
}

const getSingleFalseSingleEffects = (board: SolverBoard, point: Point, cand: number): SetValueEffect[] => {
    const cell = getBoardCell(board, point)
    const cands = [...cell.candidates]
    cell.candidates = cell.candidates.filter(c => c !== cand)
    const effects = uniqueEffects([
        ...getNakedSingle(board, point),
        ...getHiddenSingles(board)
    ])
    cell.candidates = cands
    return effects
}
const getSingleFalseGroupEffects = (board: SolverBoard, point: Point, cand: number): GroupSetValueEffect[] => {
    return getGroupFalseGroupEffects(board, [point], cand)
}

const getSingleTrueSingleEffects = (board: SolverBoard, point: Point, cand: number): EliminationEffect[] => {
    const cell = getBoardCell(board, point)
    return [
        ...removeCandidatesFromPoints(board, [point], cell.candidates.filter(c => c !== cand)),
        ...removeCandidateFromAffectedPoints(board, point, cand) as EliminationEffect[]
    ]
}
const getSingleTrueGroupEffects = (board: SolverBoard, singleTrueSingleEffects: EliminationEffect[]): GroupEliminationEffect[] => {
    return getGroupTrueGroupEffects(board, singleTrueSingleEffects)
}

// If group is false, what single point effects are there?
const getGroupFalseSingleEffects = (board: SolverBoard, points: Point[], cand: number): SetValueEffect[] => {
    board = cloneBoard(board)
    for(let point of points){
        const cell = getBoardCell(board, point)
        cell.candidates = cell.candidates.filter(c => c !== cand)
    }
    return uniqueEffects([
        ...points.flatMap(point => getNakedSingle(board, point)),
        ...getHiddenSingles(board)
    ])
}

// If group is false, which group effects are there?
const getGroupFalseGroupEffects = (board: SolverBoard, points: Point[], cand: number): GroupSetValueEffect[] => {
    board = cloneBoard(board)
    for(let point of points){
        const cell = getBoardCell(board, point)
        cell.candidates = cell.candidates.filter(c => c !== cand)
    }
    const isColumn = unique(points.map(getColNumber)).length === 1

    const housesToCheck = [
        getBox(points[0]),
        isColumn ? getColumn(points[0].x) : getRow(points[0].y)
    ]

    const effects: GroupSetValueEffect[] = []
    for(let house of housesToCheck){
        const truePoints = getPointsWithCandidates(board, house, [cand])
        const sameBox = unique(truePoints.map(getBoxNumber)).length === 1
        const sameCol = unique(truePoints.map(getColNumber)).length === 1
        const sameRow = unique(truePoints.map(getRowNumber)).length === 1

        if(sameBox && (sameCol || sameRow)){
            effects.push({
                type: 'group-value' as const,
                group: truePoints,
                groupId: getGroupId(truePoints),
                number: cand
            })
        }
    }
    return effects
}

// If group is true, what single point effects are there?
const getGroupTrueSingleEffects = (board: SolverBoard, points: Point[], cand: number): EliminationEffect[] => {
    return intersectionOfAll(points.map(point => getSingleTrueSingleEffects(board, point, cand)), effectsEqual)
}

// If group is true, what group effects are there?
const getGroupTrueGroupEffects = (board: SolverBoard, groupTrueSingleEffects: EliminationEffect[]): GroupEliminationEffect[] => {
    const groupEffects: GroupEliminationEffect[] = []
    for(let group of getBoxGroups()){
        for(let cand of allCandidates){
            const pointsWithCand = getPointsWithCandidates(board, group, [cand])
            if(pointsWithCand.length > 2){
                const eliminatesWholeGroup = pointsWithCand.every(p => groupTrueSingleEffects.some(eff => p.id === eff.point.id && eff.numbers.includes(cand)))
                if(eliminatesWholeGroup){
                    groupEffects.push({
                        type: 'group-elimination',
                        group: pointsWithCand,
                        groupId: pointsWithCand.map(p => p.id).join('-'),
                        number: cand
                    })
                }
            }
        }
    }
    return groupEffects
}

/**
 * The table concept I glanced from hodoku. Called trebors tables or something like that.
 * The idea is to record what effects occur when a candidate is either set or not set. Only direct effects are considered.
 * Direct in this case is hidden/naked singles and just basic eliminations.
 * When a candidate is set, we can use it to make weak links towards all its effected cells. Effects are basic eliminations.
 * When a candidate is not set, we can use it to make strong links towards all its effected cells. Effects are naked/hidden singles here.
 */
export const createTable = (board: SolverBoard, points: Point[], cands: number[], withGroups: boolean = false) => {
    // Ensure the cells with the fewest candidates are stored first.
    // These are the most likely starting cells that a human would choose.
    points = points.sort((a, b) => {
        return getBoardCell(board, a).candidates.length - getBoardCell(board, b).candidates.length
    })

    const table: Table = {}
    for(let point of points){
        for(let cand of cands){
            const cell = getBoardCell(board, point)
            if(!cell.candidates.includes(cand)){
                continue
            }

            const effectsIfTrue = getSingleTrueSingleEffects(board, point, cand).filter(eff => points.some(p => pointsEqual(p, eff.point)))
            const effectsIfFalse = getSingleFalseSingleEffects(board, point, cand).filter(eff => points.some(p => pointsEqual(p, eff.point)))

            let groupEffectsIfTrue: GroupEliminationEffect[] = []
            let groupEffectsIfFalse: GroupSetValueEffect[] = []
            if(withGroups){
                groupEffectsIfTrue = getSingleTrueGroupEffects(board, effectsIfTrue)
                groupEffectsIfFalse = getSingleFalseGroupEffects(board, point, cand)
            }

            if(effectsIfTrue.length > 0 || effectsIfFalse.length > 0){
                const node: SingleNode = { type: 'single', point, cand }
                const link = getLinks(node, effectsIfTrue, effectsIfFalse, groupEffectsIfTrue, groupEffectsIfFalse)
                table[getPointKey(point)] = table[getPointKey(point)] ?? { point, links: [] }
                table[getPointKey(point)].links.push(...link)
            }
        }
    }

    if(withGroups){
        const groupTable = createGroupTable(board)
        return {
            ...table,
            ...groupTable
        }
    }

    return table
}

export const createGroupTable = (board: SolverBoard) => {
    board = cloneBoard(board)
    const table: Table = {}

    const groups = getBoxGroups()
    for(let group of groups){
        for(let cand of allCandidates){
            const points = getPointsWithCandidates(board, group, [cand])
            if(points.length >= 2){
                const groupId = getGroupId(points)
                const effectsIfTrue = getGroupTrueSingleEffects(board, points, cand)
                const effectsIfFalse = getGroupFalseSingleEffects(board, points, cand)
                const groupEffectsIfTrue = getGroupTrueGroupEffects(board, effectsIfTrue)
                const groupEffectsIfFalse = getGroupFalseGroupEffects(board, points, cand)
                const hasEffects = effectsIfTrue.length > 0 || effectsIfFalse.length > 0 || groupEffectsIfTrue.length > 0 || groupEffectsIfFalse.length > 0

                if(hasEffects){
                    const node: GroupNode = { type: 'group', groupId, points, cand }
                    const links = getLinks(node, effectsIfTrue, effectsIfFalse, groupEffectsIfTrue, groupEffectsIfFalse)
                    table[groupId] = table[groupId] ?? { points, links: [] }
                    table[groupId].links.push(...links)
                }
            }
        }
    }

    return table
}

export const getAllLinks = (table: Table, node: LinkNode) => {
    const item = table[node.type === 'single' ? getPointKey(node.point) : node.groupId]
    return item ? item.links : []
}