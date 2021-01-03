import {input as hiddenPairInput1} from '../sudokus/hiddenPair'
import {input as nakedPairInput1} from '../sudokus/nakedPair'
import {input as hiddenTripleInput1} from '../sudokus/hiddenTriple'
import {input as hiddenQuadInput1} from '../sudokus/hiddenQuad'
import { createTestBoard } from '../util'
import { hiddenPair, hiddenQuad, hiddenTriple, nakedPair } from '../../core/solvers/subset'

test('hidden pair 1', () => {
    const board = createTestBoard(hiddenPairInput1)
    const result = hiddenPair(board)

    expect(result).toMatchObject({
        effects: [{type: 'elimination', point: {y: 4, x: 8}, numbers: [6]}],
        actors: [{point: {y: 4, x: 8}}, {point: {y: 6, x: 8}}]
    })
})

test('naked pair 1', () => {
    const board = createTestBoard(nakedPairInput1)
    const result = nakedPair(board)

    expect(result).toMatchObject({
        effects: [{type: 'elimination', point: {y: 7, x: 1}, numbers: [3]}],
        actors: [{point: {y: 7, x: 2}}, {point: {y: 7, x: 3}}]
    })
})

test('hidden triple 1', () => {
    const board = createTestBoard(hiddenTripleInput1)
    const result = hiddenTriple(board)

    expect(result).toMatchObject({
        effects: [
            {type: 'elimination', point: {y: 8, x: 1}, numbers: [1]},
            {type: 'elimination', point: {y: 8, x: 2}, numbers: [6]}
        ],
        actors: [{point: {y: 8, x: 1}}, {point: {y: 8, x: 2}}, {point: {y: 7, x: 1}}]
    })
})

test('hidden quad 1', () => {
    const board = createTestBoard(hiddenQuadInput1)
    const result = hiddenQuad(board)

    expect(result).toMatchObject({
        effects: [
            {type: 'elimination', point: {y: 7, x: 4}, numbers: [6]},
            {type: 'elimination', point: {y: 6, x: 4}, numbers: [3, 6]}
        ],
        actors: [{point: {y: 7, x: 4}}, {point: {y: 7, x: 5}}, {point: {y: 6, x: 4}}, {point: {y: 6, x: 5}}]
    })
})