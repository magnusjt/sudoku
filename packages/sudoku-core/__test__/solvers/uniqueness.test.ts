import {input as hiddenRectangleInput1} from '../sudokus/hiddenRectangle'
import { createTestBoard } from '../util'
import { hiddenRectangle } from '../../src/solvers/uniqueRectangle'

test('hiddenRectangle 1', () => {
    const board = createTestBoard(hiddenRectangleInput1)
    const result = hiddenRectangle(board)

    expect(result).toMatchObject({
        "effects": [
            {"type": "elimination", "point": {"x": 5, "y": 5}, "numbers": [9]}
        ]
    })
})