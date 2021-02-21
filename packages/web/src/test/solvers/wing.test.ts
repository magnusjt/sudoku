import {input as xyWingInput1} from '../sudokus/xyWing'
import {input as xyzWingInput1} from '../sudokus/xyzWing'
import {input as wWingInput1} from '../sudokus/wWing'
import { createTestBoard } from '../util'
import { wWing, xyWing, xyzWing } from '../../core/solvers/wing'

test('xy-wing 1', () => {
    const board = createTestBoard(xyWingInput1)
    const result = xyWing(board)

    expect(result).toMatchObject({
        effects: [
            {type: 'elimination', point: {y: 0, x: 5}, numbers: [5]},
            {type: 'elimination', point: {y: 1, x: 1}, numbers: [5]}
        ],
        actors: [
            {point: {y: 1, x: 0}},
            {point: {y: 1, x: 5}},
            {point: {y: 0, x: 2}}
        ]
    })
})

test('xyz-wing 1', () => {
    const board = createTestBoard(xyzWingInput1)
    const result = xyzWing(board)

    expect(result).toMatchObject({
        effects: [
            {type: 'elimination', point: {y: 8, x: 1}, numbers: [7]}
        ],
        actors: [
            {point: {y: 6, x: 1}},
            {point: {y: 1, x: 1}},
            {point: {y: 6, x: 0}}
        ]
    })
})

test('w-wing 1', () => {
    const board = createTestBoard(wWingInput1)
    const result = wWing(board)

    expect(result).toMatchObject({
        "effects": [
            {"type": "elimination", "point": {"x": 6, "y": 5}, "numbers": [7]},
            {"type": "elimination", "point": {"x": 2, "y": 3}, "numbers": [7]}
        ]
    })
})