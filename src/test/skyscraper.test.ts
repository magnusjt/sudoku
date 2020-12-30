import {input as skyscraperInput1} from './sudokus/skyscraper'
import { createTestBoard } from './util'
import { skyscraper } from '../core/solvers/skyscraper'

test('skyscraper 1', () => {
    const board = createTestBoard(skyscraperInput1)
    const result = skyscraper(board)

    expect(result).toMatchObject({
        effects: [
            {type: 'elimination', point: {y: 0, x: 6}, numbers: [1]},
            {type: 'elimination', point: {y: 0, x: 7}, numbers: [1]},
            {type: 'elimination', point: {y: 2, x: 3}, numbers: [1]},
            {type: 'elimination', point: {y: 2, x: 4}, numbers: [1]}
        ],
        actors: [
            {point: {y: 0, x: 5}},
            {point: {y: 4, x: 5}},
            {point: {y: 2, x: 8}},
            {point: {y: 4, x: 8}}
        ]
    })
})