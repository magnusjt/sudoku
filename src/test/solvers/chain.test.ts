import {input as remotePairChainInput1} from '../sudokus/remotePairChain'
import {input as xChainInput1} from '../sudokus/xChain'
import {input as xyChainInput1} from '../sudokus/xyChain'
import { createTestBoard } from '../util'
import { remotePairChain, xChain, xyChain } from '../../core/solvers/chains'

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
            {type: 'elimination', point: {y: 6, x: 5}, numbers: [3]},
            {type: 'elimination', point: {y: 1, x: 3}, numbers: [3]},
            {type: 'elimination', point: {y: 2, x: 3}, numbers: [3]},
        ],
        actors: [
            {point: {y: 1, x: 5}},
            {point: {y: 4, x: 5}},
            {point: {y: 4, x: 3}},
            {point: {y: 6, x: 3}},
        ]
    })
})