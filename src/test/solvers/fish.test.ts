import {input as xWingInput1} from '../sudokus/xWing'
import {input as xWingFinnedInput1} from '../sudokus/xWingFinned'
import {inputSashimi as xWingFinnedSashimiInput} from '../sudokus/xWingFinned'
import {input as swordfishInput1} from '../sudokus/swordfish'
import {input as swordfishFinnedInput1} from '../sudokus/swordfishFinned'
import {inputSashimi as swordfishFinnedSashimiInput1} from '../sudokus/swordfishFinned'
import {input as jellyfishInput1} from '../sudokus/jellyfish'
import { createTestBoard } from '../util'
import {
    swordfish,
    xWing,
    jellyfish,
    xWingFinned,
    swordfishFinned,
    xWingFinnedSashimi,
    swordfishFinnedSashimi
} from '../../core/solvers/fish'
import { applyTechniques } from '../../core/solve'

test('x-wing 1', () => {
    const board = createTestBoard(xWingInput1)
    const result = xWing(board)

    expect(result).toMatchObject({
        effects: [
            {type: 'elimination', point: {y: 3, x: 4}, numbers: [5]}
        ],
        actors: [
            {point: {y: 1, x: 4}},
            {point: {y: 1, x: 7}},
            {point: {y: 4, x: 4}},
            {point: {y: 4, x: 7}}
        ]
    })
})

test('swordfish 1', () => {
    const board = createTestBoard(swordfishInput1)
    const result = swordfish(board)

    expect(result).toMatchObject({
        effects: [
            {type: 'elimination', point: {y: 6, x: 0}, numbers: [2]},
            {type: 'elimination', point: {y: 5, x: 7}, numbers: [2]},
        ],
        actors: [
            {point: {y: 1, x: 0}},
            {point: {y: 1, x: 4}},
            {point: {y: 2, x: 4}},
            {point: {y: 2, x: 7}},
            {point: {y: 8, x: 0}},
            {point: {y: 8, x: 7}},
        ]
    })
})

test('jellyfish 1', () => {
    let board = createTestBoard(jellyfishInput1)
    // There is a jellyfish after the following techniques are applied (doesn't say which are necessary)
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
        'xWing',
        'swordfish'
    ])
    const result = jellyfish(board)

    expect(result).toMatchObject({
        effects: [
            {type: 'elimination', point: {y: 1, x: 1}, numbers: [7]},
            {type: 'elimination', point: {y: 8, x: 4}, numbers: [7]},
        ],
        actors: [
            {point: {y: 0, x: 1}},
            {point: {y: 0, x: 4}},
            {point: {y: 0, x: 8}},
            {point: {y: 2, x: 1}},
            {point: {y: 2, x: 7}},
            {point: {y: 2, x: 8}},
            {point: {y: 5, x: 7}},
            {point: {y: 5, x: 8}},
            {point: {y: 6, x: 1}},
            {point: {y: 6, x: 4}},
        ]
    })
})

test('x-wing finned 1', () => {
    const board = createTestBoard(xWingFinnedInput1)
    const result = xWingFinned(board)

    expect(result).toMatchObject({
        effects: [
            {type: 'elimination', point: {y: 2, x: 2}, numbers: [9]}
        ]
    })
})

test('x-wing finned sashimi 1', () => {
    const board = createTestBoard(xWingFinnedSashimiInput)
    const result = xWingFinnedSashimi(board)

    expect(result).toMatchObject({
        effects: [
            {type: 'elimination', point: {y: 6, x: 0}, numbers: [3]}
        ]
    })
})

test('swordfish finned 1', () => {
    const board = createTestBoard(swordfishFinnedInput1)
    const result = swordfishFinned(board)

    expect(result).toMatchObject({
        effects: [
            {type: 'elimination', point: {y: 2, x: 6}, numbers: [7]}
        ]
    })
})

test('swordfish finned sashimi 1', () => {
    const board = createTestBoard(swordfishFinnedSashimiInput1)
    const result = swordfishFinnedSashimi(board)

    expect(result).toMatchObject({
        effects: [
            {type: 'elimination', point: {y: 2, x: 3}, numbers: [2]}
        ]
    })
})