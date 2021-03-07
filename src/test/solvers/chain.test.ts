import {input as remotePairChainInput1} from '../sudokus/remotePairChain'
import {input as xChainInput1} from '../sudokus/xChain'
import {input as xyChainInput1} from '../sudokus/xyChain'
import {input as simpleColoringInput1} from '../sudokus/simpleColoring'
import {input as discontinuousNiceLoopInput1} from '../sudokus/discontinuousNiceLoop'
import {
    input as discontinuousNiceLoopGroupedInput1,
    input2 as discontinuousNiceLoopGroupedInput2,
    input3 as discontinuousNiceLoopGroupedInput3
} from '../sudokus/discontinuousNiceLoopGrouped'
import {input as continuousNiceLoopInput1} from '../sudokus/continuousNiceLoop'
import {input as aicType1Input1} from '../sudokus/aicType1'
import {input as aicType2Input1} from '../sudokus/aicType2'
import { createTestBoard } from '../util'
import {
    aicType1, aicType2, continuousNiceLoop,
    createFindChain, discontinuousNiceLoop, discontinuousNiceLoopGrouped,
    remotePairChain,
    xChain,
    xyChain
} from '../../core/solvers/chains'
import { applyTechniques } from '../../core/solve'
import { simpleColoring } from '../../core/solvers/simpleColoring'

test('remote pair chain 1', () => {
    const board = createTestBoard(remotePairChainInput1)
    const result = remotePairChain(board)

    expect(result).toMatchObject({
        effects: [{type: 'elimination', point: {y: 5, x: 6}, numbers: [5]}]
    })
})

test('x chain 1', () => {
    const board = createTestBoard(xChainInput1)
    const result = xChain(board)

    expect(result).toMatchObject({
        effects: [
            {type: 'elimination', point: {y: 3, x: 1}, numbers: [7]},
        ],
        actors: [
            {point: {y: 0, x: 1}},
            {point: {y: 0, x: 8}},
            {point: {y: 1, x: 7}},
            {point: {y: 6, x: 7}},
            {point: {y: 6, x: 2}},
            {point: {y: 3, x: 2}},
        ]
    })
})

test('xy chain 1', () => {
    const board = createTestBoard(xyChainInput1)
    const result = xyChain(board)

    expect(result).toMatchObject({
        effects: [
            {type: 'elimination', point: {y: 4, x: 5}, numbers: [2]},
            {type: 'elimination', point: {y: 1, x: 4}, numbers: [2]},
        ]
    })
})

test('simple coloring 1', () => {
    let board = createTestBoard(simpleColoringInput1)
    board = applyTechniques(board, [
        'nakedSingle',
        'hiddenSingle',
        'pointer',
        'inversePointer',
        'nakedPair',
        'hiddenPair',
        'nakedTriple',
        'hiddenTriple',
        'nakedQuad',
        'hiddenQuad',
    ])
    const result = simpleColoring(board)

    expect(result).not.toBe(null)
    // Just check effects. There's too many actors in coloring..
    expect(result!.effects).toMatchObject( [
        {"type": "elimination", "point": {"x": 0, "y": 7}, "numbers": [3]},
        {"type": "elimination", "point": {"x": 8, "y": 2}, "numbers": [3]},
        {"type": "elimination", "point": {"x": 8, "y": 0}, "numbers": [3]}
    ])
})

test('aic type1 1', () => {
    const board = createTestBoard(aicType1Input1)
    const result = aicType1(createFindChain(board, false))()

    expect(result).toMatchObject({
        "effects": [
            {"type": "elimination", "point": {"x": 1, "y": 0}, "numbers": [3]}
        ]
    })
})

test('aic type2 1', () => {
    const board = createTestBoard(aicType2Input1)
    const result = aicType2(createFindChain(board, false))()

    expect(result).toMatchObject({
        "effects": [
            {"type": "elimination", "point": {"x": 0, "y": 8}, "numbers": [8]}
        ]
    })
})

test('discontinuous nice loop 1', () => {
    const board = createTestBoard(discontinuousNiceLoopInput1)
    const result = discontinuousNiceLoop(createFindChain(board, false))()

    expect(result).toMatchObject({
        "effects": [
            {"type": "elimination", "point": {"x": 7, "y": 0}, "numbers": [7]},
        ]
    })
})

test('continuous nice loop 1', () => {
    const board = createTestBoard(continuousNiceLoopInput1)
    const result = continuousNiceLoop(createFindChain(board, false))()

    expect(result).toMatchObject({
        "effects": [
            {"type": "elimination", "point": {"x": 4, "y": 1}, "numbers": [3]},
            {"type": "elimination", "point": {"x": 4, "y": 5}, "numbers": [3]},
            {"type": "elimination", "point": {"x": 5, "y": 7}, "numbers": [8]},
            {"type": "elimination", "point": {"x": 5, "y": 6}, "numbers": [6, 8]},
            {"type": "elimination", "point": {"x": 3, "y": 3}, "numbers": [2]},
            {"type": "elimination", "point": {"x": 3, "y": 5}, "numbers": [2]},
            {"type": "elimination", "point": {"x": 4, "y": 5}, "numbers": [2]}
        ]
    })
})

test('discontinuous nice loop grouped 1', () => {
    let board = createTestBoard(discontinuousNiceLoopGroupedInput1)
    board = applyTechniques(board, [
        'nakedSingle',
        'hiddenSingle',
        'pointer',
        'inversePointer',
        'nakedPair',
        'hiddenPair',
        'nakedTriple',
        'hiddenTriple',
        'nakedQuad',
        'hiddenQuad',

    ])
    const result = discontinuousNiceLoopGrouped(createFindChain(board, false))()

    expect(result).toMatchObject({
        "effects": [
            {"type": "elimination", "point": {"x": 1, "y": 1}, "numbers": [9]},
        ]
    })
})

test('discontinuous nice loop grouped 2', () => {
    let board = createTestBoard(discontinuousNiceLoopGroupedInput2)
    board = applyTechniques(board, [
        'basic',
        'fullHouse',
        'hiddenSingle',
        'pointer',
        'inversePointer',
        'nakedSingle',
        'nakedPair',
        'hiddenPair',
        'xWing',
        'nakedTriple',
        'hiddenTriple',
        'nakedQuad',
        'uniqueRectangle1',
        'bugPlus1',
        'skyscraper',
        'swordfish',
        'emptyRectangle',
        'hiddenQuad',
        'remotePairChain',
        'wWing',
        'jellyfish',
        'xyWing',
        'xyzWing',
        'simpleColoring',
        'xChain',
        'xyChain',
        'discontinuousNiceLoop',
    ])
    const result = discontinuousNiceLoopGrouped(createFindChain(board, false))()

    expect(result).toMatchObject({
        "effects": [
            {"type": "elimination", "point": {"x": 1, "y": 0}, "numbers": [8]},
        ]
    })
})


test('discontinuous nice loop grouped 3', () => {
    let board = createTestBoard(discontinuousNiceLoopGroupedInput3)
    board = applyTechniques(board, [
        'basic',
        'fullHouse',
        'hiddenSingle',
        'pointer',
        'inversePointer',
        'nakedSingle',
        'nakedPair',
        'hiddenPair',
        'xWing',
        'nakedTriple',
        'hiddenTriple',
        'nakedQuad',
        'uniqueRectangle1',
        'bugPlus1',
        'skyscraper',
        'swordfish',
        'emptyRectangle',
        'hiddenQuad',
        'remotePairChain',
        'wWing',
        'jellyfish',
        'xyWing',
        'xyzWing',
        'simpleColoring',
        'xChain',
        'xyChain',
        'discontinuousNiceLoop',
    ])
    const result = discontinuousNiceLoopGrouped(createFindChain(board, false))()

    expect(result).toMatchObject({
        "effects": [
            {"type": "elimination", "point": {"x": 8, "y": 8}, "numbers": [1]},
        ]
    })
})