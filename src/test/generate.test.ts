import { generateBoards } from '../core/generate'
import { hasUniqueSolution } from '../core/utils/hasUniqueSolution'
import { createTestBoard } from './util'
import { input as knownUniqueInput} from './sudokus/nakedPair'
import { first } from '../core/utils'

test('hasUniqueSolution', () => {
    const board = createTestBoard(knownUniqueInput)
    const result = hasUniqueSolution(board)
    expect(result).toBe(true)
})

test('generate', () => {
    const board = first(generateBoards(32))
    let x = 5
})