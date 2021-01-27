import {input as remotePairChainInput1} from '../sudokus/remotePairChain'
import { createTestBoard } from '../util'
import { remotePairChain } from '../../core/solvers/chains'

test('remote pair chain 1', () => {
    const board = createTestBoard(remotePairChainInput1)
    const result = remotePairChain(board)

    expect(result).toMatchObject({
        effects: [{type: 'elimination', point: {y: 4, x: 8}, numbers: [6]}],
        actors: [{point: {y: 4, x: 8}}, {point: {y: 6, x: 8}}]
    })
})