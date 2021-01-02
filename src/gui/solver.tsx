import React from 'react'
import { Board, Point, SolveResult } from '../core/types'
import * as solve from '../core/solve'
import { getTechniquesUntilNextValue } from '../core/sudoku'

export type SolverProps = {
    board: Board
    solveResult: SolveResult | null
    onSolveResult: (solveResult: SolveResult | null, prevBoard: Board) => void
}

const pointToStr = (point: Point) => `r${point.y+1}c${point.x+1}`

export const Solver = (props: SolverProps) => {
    const {board, solveResult, onSolveResult} = props
    const nextTechniques = React.useMemo(() => getTechniquesUntilNextValue(board), [board])
    const [skippedTechniques, setSkippedTechniques] = React.useState<string[]>([])

    const onToggleTechnique = React.useCallback((type: string) => {
        setSkippedTechniques(s => {
            if(s.some(t => t === type)){
                return s.filter(t => t !== type)
            }else{
                return [...s, type]
            }
        })
    }, [])

    const iterate = React.useCallback(() => {
        let boardBeforeSolve = board
        let res = solve.iterate(boardBeforeSolve)
        while(res !== null && skippedTechniques.includes(res.technique)){
            boardBeforeSolve = res.board
            res = solve.iterate(boardBeforeSolve)
        }
        onSolveResult(res, boardBeforeSolve)
    }, [board, skippedTechniques, onSolveResult])

    return (
        <div>
            Techniques needed for next value:
            <br />
            {nextTechniques.map(t => <div>{t}</div>)}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={iterate}>Iterate</button>
            </div>
            <div>
                Skip techniques
                <div style={{display: 'flex', flexDirection: 'column'}}>
                {solve.techniques.map(tech => {
                    const skipped = skippedTechniques.some(t => t === tech.type)
                    return (
                        <button style={{color: skipped ? 'red' : ''}} onClick={() => onToggleTechnique(tech.type)}>
                            {tech.type}
                        </button>
                    )
                })}
                </div>
            </div>

            {solveResult &&
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div>
                    Technique: {solveResult.technique}
                    <br />
                    Effects
                    {solveResult.effects.map(effect => {
                        return (
                            <div>
                                {effect.type === 'elimination' &&
                                <div>
                                    Eliminate {effect.numbers.join(',')} from {pointToStr(effect.point)}
                                </div>
                                }
                                {effect.type === 'value' &&
                                <div>
                                    Set {effect.number} at {pointToStr(effect.point)}
                                </div>
                                }
                            </div>
                        )
                    })}
                    <br />
                    Actors:
                    {solveResult.actors.map(actor => {
                        return (
                            <div>
                                {pointToStr(actor.point)}
                            </div>
                        )
                    })}
                </div>
            </div>
            }
        </div>
    )
}