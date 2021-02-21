import {input as emptyRectangleInput1} from '../sudokus/emptyRectangle'
import { createTestBoard } from '../util'
import { emptyRectangle } from '../../core/solvers/emptyRectangle'

test('emptyRectangle 1', () => {
    const board = createTestBoard(emptyRectangleInput1)
    const result = emptyRectangle(board)

    expect(result).toMatchObject({
        effects: [
            {type: 'elimination', point: {y: 8, x: 2}, numbers: [2]}
        ],
        actors: [
            {point: {y: 4, x: 0}},
            {point: {y: 3, x: 2}},
            {point: {y: 4, x: 2}},
            {point: {y: 4, x: 3}},
            {point: {y: 8, x: 3}}
        ]
    })
})