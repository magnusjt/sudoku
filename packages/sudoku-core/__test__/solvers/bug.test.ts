import {input as bugPlus1Input1} from '../sudokus/bugPlus1'
import { createTestBoard } from '../util'
import { bugPlus1 } from '../../src/solvers/bug'

test('BUG+1 1', () => {
    const board = createTestBoard(bugPlus1Input1)
    const result = bugPlus1(board)

    expect(result).toMatchObject({
        "actors": [
            {"point": {"x": 2, "y": 0}},
            {"point": {"x": 2, "y": 1}},
            {"point": {"x": 2, "y": 2}},
            {"point": {"x": 5, "y": 0}},
            {"point": {"x": 5, "y": 1}},
            {"point": {"x": 5, "y": 2}},
            {"point": {"x": 6, "y": 0}},
            {"point": {"x": 6, "y": 2}},
            {"point": {"x": 6, "y": 3}},
            {"point": {"x": 7, "y": 1}},
            {"point": {"x": 7, "y": 2}},
            {"point": {"x": 7, "y": 3}}
        ],
        "effects": [
            {"type": "value", "point": {"x": 7, "y": 0}, "number": 6},
            {"type": "elimination", "point": {"x": 7, "y": 1}, "numbers": [6]},
            {"type": "elimination", "point": {"x": 7, "y": 3}, "numbers": [6]},
            {"type": "elimination", "point": {"x": 2, "y": 0}, "numbers": [6]},
            {"type": "elimination", "point": {"x": 6, "y": 0}, "numbers": [6]}
        ]
    })
})