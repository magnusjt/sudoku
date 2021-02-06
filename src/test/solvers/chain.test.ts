import {input as remotePairChainInput1} from '../sudokus/remotePairChain'
import {input as xChainInput1} from '../sudokus/xChain'
import {input as xyChainInput1} from '../sudokus/xyChain'
import {input as simpleColoringInput1} from '../sudokus/simpleColoring'
import { createTestBoard } from '../util'
import { remotePairChain, simpleColoring, xChain, xyChain } from '../../core/solvers/chains'
import { applyTechniques } from '../../core/solve'

test('remote pair chain 1', () => {
    const board = createTestBoard(remotePairChainInput1)
    const result = remotePairChain(board)

    expect(result).toMatchObject({
        effects: [{type: 'elimination', point: {y: 5, x: 6}, numbers: [5]}],
        actors: [
            {point: {y: 5, x: 0}},
            {point: {y: 2, x: 0}},
            {point: {y: 2, x: 8}},
            {point: {y: 1, x: 6}},
        ]
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
            {type: 'elimination', point: {y: 1, x: 3}, numbers: [3]},
            {type: 'elimination', point: {y: 2, x: 3}, numbers: [3]},
            {type: 'elimination', point: {y: 6, x: 5}, numbers: [3]},
        ],
        actors: [
            {point: {y: 6, x: 3}},
            {point: {y: 6, x: 3}},
            {point: {y: 4, x: 3}},
            {point: {y: 4, x: 3}},
            {point: {y: 4, x: 5}},
            {point: {y: 4, x: 5}},
            {point: {y: 1, x: 5}},
            {point: {y: 1, x: 5}},
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
        {"type": "elimination", "point": {"x": 8, "y": 0}, "numbers": [3]},
        {"type": "elimination", "point": {"x": 8, "y": 2}, "numbers": [3]}
    ])
})